const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Enforces football-data.org Free Tier quota (10 requests / minute)
 * using a serialized sliding-window queue + singleflight deduplication.
 */
class RateLimiter {
  constructor({ maxRequestsPerWindow = 9, windowMs = 62000, minSpacingMs = 1500 } = {}) {
    this.maxRequestsPerWindow = maxRequestsPerWindow;
    this.windowMs = windowMs;
    this.minSpacingMs = minSpacingMs;
    this.timestamps = [];
    this.queue = [];
    this.processing = false;
    this.inFlight = new Map();
    this.rateLimitedUntil = 0;
    this.totalRequests = 0;
    this.rateLimitHits = 0;
    this.lastRequestAt = null;
    this.apiReportedRemaining = null;
  }

  _pruneOldTimestamps(now = Date.now()) {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] < cutoff) {
      this.timestamps.shift();
    }
  }

  dedupe(key, taskFn) {
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const promise = Promise.resolve()
      .then(() => taskFn())
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  schedule(taskFn, { priority = 'normal' } = {}) {
    return new Promise((resolve, reject) => {
      const item = { taskFn, resolve, reject, priority };
      if (priority === 'high') {
        // Put high-priority user-facing calls ahead of background cron calls
        const firstLowIdx = this.queue.findIndex((q) => q.priority !== 'high');
        if (firstLowIdx === -1) {
          this.queue.push(item);
        } else {
          this.queue.splice(firstLowIdx, 0, item);
        }
      } else {
        this.queue.push(item);
      }
      this._drain();
    });
  }

  notifyHeaders(headers = {}) {
    const avail = Number(headers['x-requests-available-minute']);
    if (!Number.isNaN(avail)) {
      this.apiReportedRemaining = avail;
    }
  }

  notifyRateLimit(retryAfterSeconds = 60) {
    this.rateLimitHits += 1;
    const waitMs = Math.max(Number(retryAfterSeconds) || 60, 10) * 1000;
    this.rateLimitedUntil = Math.max(this.rateLimitedUntil, Date.now() + waitMs);
  }

  async _waitForSlot() {
    while (true) {
      const now = Date.now();
      this._pruneOldTimestamps(now);

      if (this.rateLimitedUntil > now) {
        await sleep(this.rateLimitedUntil - now + 200);
        continue;
      }

      if (this.timestamps.length >= this.maxRequestsPerWindow) {
        const oldest = this.timestamps[0];
        const waitMs = oldest + this.windowMs - now + 150;
        await sleep(Math.max(waitMs, 250));
        continue;
      }

      const lastTs = this.timestamps[this.timestamps.length - 1];
      if (lastTs && now - lastTs < this.minSpacingMs) {
        await sleep(this.minSpacingMs - (now - lastTs));
        continue;
      }

      return;
    }
  }

  async _drain() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0) {
        await this._waitForSlot();
        const item = this.queue.shift();
        if (!item) continue;

        const executedAt = Date.now();
        this.timestamps.push(executedAt);
        this.lastRequestAt = new Date(executedAt).toISOString();
        this.totalRequests += 1;

        try {
          const result = await item.taskFn();
          item.resolve(result);
        } catch (err) {
          item.reject(err);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  getStats() {
    this._pruneOldTimestamps();
    return {
      maxRequestsPerMinute: 10,
      safeCapPerWindow: this.maxRequestsPerWindow,
      usedInCurrentWindow: this.timestamps.length,
      remainingInWindow: Math.max(0, this.maxRequestsPerWindow - this.timestamps.length),
      queueDepth: this.queue.length,
      inFlightCount: this.inFlight.size,
      totalRequests: this.totalRequests,
      rateLimitHits: this.rateLimitHits,
      rateLimitedUntil: this.rateLimitedUntil > Date.now() ? new Date(this.rateLimitedUntil).toISOString() : null,
      lastRequestAt: this.lastRequestAt,
      apiReportedRemaining: this.apiReportedRemaining,
    };
  }
}

const rateLimiter = new RateLimiter();

module.exports = {
  RateLimiter,
  rateLimiter,
};
