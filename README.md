# Football Data Central (FDC Web Platform)

เว็บแอปพลิเคชันฐานข้อมูลฟุตบอลยุโรป 8 รายการหลัก (5 ลีกใหญ่ยุโรป + 3 ถ้วยสโมสรยุโรป) ออกแบบให้ **เปิดเข้าดูข้อมูลได้ทันทีโดยไม่ต้องสมัครสมาชิกหรือเข้าสู่ระบบ (Public Read-Only)** และแยกโครงสร้าง **หน้าบ้าน (`frontend/`)** กับ **หลังบ้าน (`backend/`)** ออกจากกันอย่างชัดเจน

## ขอบเขตข้อมูล (Data Scope - 8 Competitions)

- **5 ลีกใหญ่ยุโรป (Top 5 European Leagues):** Premier League (`PL`), La Liga (`PD`), Serie A (`SA`), Bundesliga (`BL1`), Ligue 1 (`FL1`)
- **3 ถ้วยสโมสรยุโรป (UEFA Competitions):** UEFA Champions League (`CL`), UEFA Europa League (`EL`), UEFA Conference League (`UCL`, รองรับ alias `EC`)

## ฟีเจอร์หลัก (Features)

- **ภาพรวม (Dashboard Overview):** แสดงแมตช์ที่กำลังแข่ง ผลบอลล่าสุด โปรแกรมถัดไป ตารางคะแนนย่อ และดาวซัลโวทั้ง 8 รายการ
- **ตารางคะแนน (Standings):** ตารางคะแนนแยกตามลีก/ถ้วย พร้อมตัวกรอง รวม / เหย้า / เยือน, โซนโควตายุโรป/ตกชั้น และฟอร์ม 5 นัดล่าสุด
- **ผลบอลและโปรแกรม (Match Results & Fixtures):** ผลบอลย้อนหลัง โปรแกรมล่วงหน้า ตัวกรองตามสถานะ/Matchday/ชื่อทีม และหน้าต่างสถิติการพบกัน (Head-to-Head)
- **ข้อมูลทีมและนักเตะ (Team & Player Profiles):** โปรไฟล์สโมสร (สนาม, โค้ช, รายชื่อนักเตะแยกตำแหน่ง, โปรแกรมของทีม) และโปรไฟล์นักเตะพร้อมสถิติดาวซัลโว/แอสซิสต์/ลงเล่น + ระบบค้นหาสโมสรและนักเตะแบบเรียลไทม์
- **FDC Supercomputer:** คำนวณความน่าจะเป็นผลแข่ง (Poisson xG + Dixon-Coles) และจำลองอันดับฤดูกาล 10,000 รอบ (Monte Carlo Simulation) พร้อม What-If Matchup Simulator

## สถาปัตยกรรมระบบ & การจัดการ Rate Limit

```text
football-data-central/
├── .github/workflows/ # CI + Deploy GitHub Pages อัตโนมัติ
├── docker-compose.yml # PostgreSQL 16 + Redis 7 (Optional สำหรับ Local Dev)
├── render.yaml        # Blueprint สำหรับ Deploy Backend บน Render
├── frontend/          # React + Vite + TailwindCSS (SPA - Public UI, Port 5173)
└── backend/           # Node.js + Express + PostgreSQL + Redis + node-cron (Port 5001)
```

- **Backend-Only API Proxy & Rate Limiter:** มีเพียง `backend` เท่านั้นที่เรียกข้อมูลจาก `football-data.org` (Free Tier: 10 requests/minute) ผ่าน Sliding-Window Queue และ Singleflight Deduplication
- **Multi-Tier Cache & Fallback:**
  1. **L1 Redis Cache**
  2. **L2 PostgreSQL Snapshot Cache (`cached_snapshots`)** ตรวจสอบ TTL ก่อนเรียก API
  3. **L3 Persistent Local Snapshot (`backend/data/`)** + **Demo Seed Fallback** (ทำงานได้ทันทีแม้ยังไม่ได้ใส่ API Key หรือรายการที่ติดข้อจำกัด Free Tier เช่น `EL`/`UCL`)
- **Smart Scheduled Sync (`node-cron`):**
  - ตารางคะแนน, ดาวซัลโว และข้อมูลทีม: อัปเดตทุก 2 ชั่วโมง
  - ผลการแข่งขัน: ตรวจสอบทุก 5 นาที และ Sync ถี่เฉพาะช่วงที่มีการแข่งขัน (Active Match Window) เพื่อประหยัด API Quota

## การติดตั้งและรันโปรเจกต์ (Local Development)

### 0. (Optional) รัน PostgreSQL & Redis ด้วย Docker

```bash
docker compose up -d
```

_(หากยังไม่มี PostgreSQL หรือ Redis ในเครื่อง Backend จะทำงานด้วย Local Cache + Demo Fallback อัตโนมัติ)_

### 1. Backend

```bash
cd backend
cp .env.example .env
# ใส่ FOOTBALL_DATA_API_KEY ใน .env (ถ้าไม่ใส่ ระบบจะแสดง Demo Dataset ให้ทดสอบครบทุกหน้า)
npm install
npm test
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

เปิดใช้งานที่ `http://localhost:5173` (Backend API: `http://localhost:5001/api`)

---

## การ Deploy บน GitHub (GitHub Pages + CI/CD)

โปรเจกต์มี Workflow พร้อมใช้งานใน `.github/workflows/`:
- **CI (`.github/workflows/ci.yml`):** รัน Backend tests และ Frontend build ทุกครั้งที่ Push / PR เข้า `main`
- **GitHub Pages (`.github/workflows/deploy-pages.yml`):** สร้าง Static API Snapshots (`backend/scripts/exportStaticApi.js`) และ Deploy หน้าเว็บ Frontend ไปยัง GitHub Pages อัตโนมัติ

### ขั้นตอนเปิดใช้งานบน GitHub
1. ไปที่ Repository บน GitHub → **Settings** → **Pages** → เลือก **Build and deployment Source** เป็น **`GitHub Actions`**
2. *(ทางเลือก: ดึงข้อมูลจริงขึ้น GitHub Pages)* ไปที่ **Settings** → **Secrets and variables** → **Actions** → เพิ่ม Secret ชื่อ `FOOTBALL_DATA_API_KEY` (Workflow จะอัปเดต Snapshot ให้อัตโนมัติทุก 6 ชั่วโมงและทุกครั้งที่ Push)
3. *(ทางเลือก: เชื่อม Backend จริงแบบ Real-time)* สามารถ Deploy โฟลเดอร์ `backend/` (ใช้ [render.yaml](render.yaml) หรือ [backend/Dockerfile](backend/Dockerfile)) แล้วนำ URL มาใส่ใน GitHub Actions **Variables** ชื่อ `VITE_API_BASE_URL` (เช่น `https://fdc-backend.onrender.com/api`)
4. เปิดหน้าเว็บได้ที่ `https://thongek-next-wpm.github.io/football-data-central/`
