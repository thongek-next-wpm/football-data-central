// Realistic European club catalog for demo fallback & offline preview.
// Note: Uses official football-data.org team IDs for major clubs where applicable.

const CLUBS = {
  // === PREMIER LEAGUE (PL) ===
  57: {
    id: 57, name: 'Arsenal FC', shortName: 'Arsenal', tla: 'ARS', area: 'England',
    colors: ['#EF0107', '#FFFFFF'], venue: 'Emirates Stadium', founded: 1886,
    coach: 'Mikel Arteta', coachNat: 'Spain', league: 'PL', uefa: 'CL',
    stars: [
      { id: 9001, name: 'Bukayo Saka', pos: 'Right Winger', nat: 'England', num: 7, g: 11, a: 10, p: 2 },
      { id: 9002, name: 'Martin Ødegaard', pos: 'Attacking Midfield', nat: 'Norway', num: 8, g: 6, a: 9, p: 0 },
      { id: 9003, name: 'Kai Havertz', pos: 'Centre-Forward', nat: 'Germany', num: 29, g: 12, a: 4, p: 1 },
      { id: 9004, name: 'Declan Rice', pos: 'Defensive Midfield', nat: 'England', num: 41, g: 4, a: 6, p: 0 },
      { id: 9005, name: 'William Saliba', pos: 'Centre-Back', nat: 'France', num: 2, g: 2, a: 1, p: 0 },
      { id: 9006, name: 'David Raya', pos: 'Goalkeeper', nat: 'Spain', num: 22, g: 0, a: 0, p: 0 },
    ],
  },
  64: {
    id: 64, name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV', area: 'England',
    colors: ['#C8102E', '#00B2A9'], venue: 'Anfield', founded: 1892,
    coach: 'Arne Slot', coachNat: 'Netherlands', league: 'PL', uefa: 'CL',
    stars: [
      { id: 9011, name: 'Mohamed Salah', pos: 'Right Winger', nat: 'Egypt', num: 11, g: 16, a: 11, p: 4 },
      { id: 9012, name: 'Luis Díaz', pos: 'Left Winger', nat: 'Colombia', num: 7, g: 10, a: 4, p: 0 },
      { id: 9013, name: 'Alexis Mac Allister', pos: 'Central Midfield', nat: 'Argentina', num: 10, g: 5, a: 6, p: 0 },
      { id: 9014, name: 'Virgil van Dijk', pos: 'Centre-Back', nat: 'Netherlands', num: 4, g: 3, a: 1, p: 0 },
      { id: 9015, name: 'Alisson Becker', pos: 'Goalkeeper', nat: 'Brazil', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  65: {
    id: 65, name: 'Manchester City FC', shortName: 'Man City', tla: 'MCI', area: 'England',
    colors: ['#6CABDD', '#1C2C5B'], venue: 'Etihad Stadium', founded: 1880,
    coach: 'Pep Guardiola', coachNat: 'Spain', league: 'PL', uefa: 'CL',
    stars: [
      { id: 9021, name: 'Erling Haaland', pos: 'Centre-Forward', nat: 'Norway', num: 9, g: 18, a: 3, p: 3 },
      { id: 9022, name: 'Phil Foden', pos: 'Attacking Midfield', nat: 'England', num: 47, g: 9, a: 6, p: 0 },
      { id: 9023, name: 'Kevin De Bruyne', pos: 'Attacking Midfield', nat: 'Belgium', num: 17, g: 4, a: 10, p: 0 },
      { id: 9024, name: 'Rúben Dias', pos: 'Centre-Back', nat: 'Portugal', num: 3, g: 1, a: 1, p: 0 },
      { id: 9025, name: 'Ederson', pos: 'Goalkeeper', nat: 'Brazil', num: 31, g: 0, a: 1, p: 0 },
    ],
  },
  61: {
    id: 61, name: 'Chelsea FC', shortName: 'Chelsea', tla: 'CHE', area: 'England',
    colors: ['#034694', '#FFFFFF'], venue: 'Stamford Bridge', founded: 1905,
    coach: 'Enzo Maresca', coachNat: 'Italy', league: 'PL', uefa: 'UCL',
    stars: [
      { id: 9031, name: 'Cole Palmer', pos: 'Attacking Midfield', nat: 'England', num: 20, g: 14, a: 8, p: 4 },
      { id: 9032, name: 'Nicolas Jackson', pos: 'Centre-Forward', nat: 'Senegal', num: 15, g: 10, a: 4, p: 0 },
      { id: 9033, name: 'Enzo Fernández', pos: 'Central Midfield', nat: 'Argentina', num: 8, g: 4, a: 7, p: 0 },
      { id: 9034, name: 'Levi Colwill', pos: 'Centre-Back', nat: 'England', num: 6, g: 1, a: 1, p: 0 },
      { id: 9035, name: 'Robert Sánchez', pos: 'Goalkeeper', nat: 'Spain', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  58: {
    id: 58, name: 'Aston Villa FC', shortName: 'Aston Villa', tla: 'AVL', area: 'England',
    colors: ['#670E36', '#95BFE5'], venue: 'Villa Park', founded: 1874,
    coach: 'Unai Emery', coachNat: 'Spain', league: 'PL', uefa: 'CL',
    stars: [
      { id: 9041, name: 'Ollie Watkins', pos: 'Centre-Forward', nat: 'England', num: 11, g: 12, a: 6, p: 1 },
      { id: 9042, name: 'Morgan Rogers', pos: 'Attacking Midfield', nat: 'England', num: 27, g: 7, a: 5, p: 0 },
      { id: 9043, name: 'Youri Tielemans', pos: 'Central Midfield', nat: 'Belgium', num: 8, g: 3, a: 6, p: 0 },
      { id: 9044, name: 'Emiliano Martínez', pos: 'Goalkeeper', nat: 'Argentina', num: 23, g: 0, a: 0, p: 0 },
    ],
  },
  67: {
    id: 67, name: 'Newcastle United FC', shortName: 'Newcastle', tla: 'NEW', area: 'England',
    colors: ['#241F20', '#FFFFFF'], venue: "St. James' Park", founded: 1892,
    coach: 'Eddie Howe', coachNat: 'England', league: 'PL', uefa: null,
    stars: [
      { id: 9051, name: 'Alexander Isak', pos: 'Centre-Forward', nat: 'Sweden', num: 14, g: 15, a: 4, p: 2 },
      { id: 9052, name: 'Anthony Gordon', pos: 'Left Winger', nat: 'England', num: 10, g: 8, a: 6, p: 0 },
      { id: 9053, name: 'Bruno Guimarães', pos: 'Defensive Midfield', nat: 'Brazil', num: 39, g: 3, a: 6, p: 0 },
      { id: 9054, name: 'Nick Pope', pos: 'Goalkeeper', nat: 'England', num: 22, g: 0, a: 0, p: 0 },
    ],
  },
  73: {
    id: 73, name: 'Tottenham Hotspur FC', shortName: 'Tottenham', tla: 'TOT', area: 'England',
    colors: ['#132257', '#FFFFFF'], venue: 'Tottenham Hotspur Stadium', founded: 1882,
    coach: 'Ange Postecoglou', coachNat: 'Australia', league: 'PL', uefa: 'EL',
    stars: [
      { id: 9061, name: 'Son Heung-min', pos: 'Left Winger', nat: 'South Korea', num: 7, g: 10, a: 7, p: 1 },
      { id: 9062, name: 'Dominic Solanke', pos: 'Centre-Forward', nat: 'England', num: 19, g: 9, a: 4, p: 0 },
      { id: 9063, name: 'James Maddison', pos: 'Attacking Midfield', nat: 'England', num: 10, g: 7, a: 6, p: 0 },
      { id: 9064, name: 'Guglielmo Vicario', pos: 'Goalkeeper', nat: 'Italy', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  66: {
    id: 66, name: 'Manchester United FC', shortName: 'Man United', tla: 'MUN', area: 'England',
    colors: ['#DA291C', '#FBE122'], venue: 'Old Trafford', founded: 1878,
    coach: 'Ruben Amorim', coachNat: 'Portugal', league: 'PL', uefa: 'EL',
    stars: [
      { id: 9071, name: 'Bruno Fernandes', pos: 'Attacking Midfield', nat: 'Portugal', num: 8, g: 8, a: 9, p: 3 },
      { id: 9072, name: 'Amad Diallo', pos: 'Right Winger', nat: 'Ivory Coast', num: 16, g: 7, a: 6, p: 0 },
      { id: 9073, name: 'Rasmus Højlund', pos: 'Centre-Forward', nat: 'Denmark', num: 9, g: 6, a: 2, p: 0 },
      { id: 9074, name: 'André Onana', pos: 'Goalkeeper', nat: 'Cameroon', num: 24, g: 0, a: 0, p: 0 },
    ],
  },
  397: {
    id: 397, name: 'Brighton & Hove Albion FC', shortName: 'Brighton', tla: 'BHA', area: 'England',
    colors: ['#0057B8', '#FFFFFF'], venue: 'Amex Stadium', founded: 1901,
    coach: 'Fabian Hürzeler', coachNat: 'Germany', league: 'PL', uefa: null,
    stars: [
      { id: 9081, name: 'Kaoru Mitoma', pos: 'Left Winger', nat: 'Japan', num: 22, g: 7, a: 5, p: 0 },
      { id: 9082, name: 'João Pedro', pos: 'Centre-Forward', nat: 'Brazil', num: 9, g: 8, a: 4, p: 3 },
    ],
  },
  351: {
    id: 351, name: 'Nottingham Forest FC', shortName: 'Nottm Forest', tla: 'NFO', area: 'England',
    colors: ['#DD0000', '#FFFFFF'], venue: 'The City Ground', founded: 1865,
    coach: 'Nuno Espírito Santo', coachNat: 'Portugal', league: 'PL', uefa: null,
    stars: [
      { id: 9086, name: 'Chris Wood', pos: 'Centre-Forward', nat: 'New Zealand', num: 11, g: 13, a: 2, p: 2 },
      { id: 9087, name: 'Morgan Gibbs-White', pos: 'Attacking Midfield', nat: 'England', num: 10, g: 5, a: 7, p: 0 },
    ],
  },
  1044: { id: 1044, name: 'AFC Bournemouth', shortName: 'Bournemouth', tla: 'BOU', area: 'England', colors: ['#DA291C', '#000000'], venue: 'Vitality Stadium', founded: 1899, coach: 'Andoni Iraola', coachNat: 'Spain', league: 'PL', uefa: null, stars: [{ id: 9091, name: 'Justin Kluivert', pos: 'Attacking Midfield', nat: 'Netherlands', num: 19, g: 9, a: 4, p: 3 }] },
  63: { id: 63, name: 'Fulham FC', shortName: 'Fulham', tla: 'FUL', area: 'England', colors: ['#000000', '#FFFFFF'], venue: 'Craven Cottage', founded: 1879, coach: 'Marco Silva', coachNat: 'Portugal', league: 'PL', uefa: null, stars: [{ id: 9092, name: 'Raúl Jiménez', pos: 'Centre-Forward', nat: 'Mexico', num: 7, g: 8, a: 3, p: 2 }] },
  402: { id: 402, name: 'Brentford FC', shortName: 'Brentford', tla: 'BRE', area: 'England', colors: ['#E30613', '#FFFFFF'], venue: 'Gtech Community Stadium', founded: 1889, coach: 'Thomas Frank', coachNat: 'Denmark', league: 'PL', uefa: null, stars: [{ id: 9093, name: 'Bryan Mbeumo', pos: 'Right Winger', nat: 'Cameroon', num: 19, g: 13, a: 4, p: 3 }] },
  354: { id: 354, name: 'Crystal Palace FC', shortName: 'Crystal Palace', tla: 'CRY', area: 'England', colors: ['#1B458F', '#C4122E'], venue: 'Selhurst Park', founded: 1905, coach: 'Oliver Glasner', coachNat: 'Austria', league: 'PL', uefa: null, stars: [{ id: 9094, name: 'Jean-Philippe Mateta', pos: 'Centre-Forward', nat: 'France', num: 14, g: 9, a: 2, p: 1 }] },
  563: { id: 563, name: 'West Ham United FC', shortName: 'West Ham', tla: 'WHU', area: 'England', colors: ['#7A263A', '#1BB1E7'], venue: 'London Stadium', founded: 1895, coach: 'Graham Potter', coachNat: 'England', league: 'PL', uefa: null, stars: [{ id: 9095, name: 'Jarrod Bowen', pos: 'Right Winger', nat: 'England', num: 20, g: 8, a: 5, p: 0 }] },
  62: { id: 62, name: 'Everton FC', shortName: 'Everton', tla: 'EVE', area: 'England', colors: ['#003399', '#FFFFFF'], venue: 'Goodison Park', founded: 1878, coach: 'David Moyes', coachNat: 'Scotland', league: 'PL', uefa: null, stars: [{ id: 9096, name: 'Iliman Ndiaye', pos: 'Left Winger', nat: 'Senegal', num: 10, g: 6, a: 2, p: 0 }] },
  76: { id: 76, name: 'Wolverhampton Wanderers FC', shortName: 'Wolves', tla: 'WOL', area: 'England', colors: ['#FDB913', '#231F20'], venue: 'Molineux Stadium', founded: 1877, coach: 'Vítor Pereira', coachNat: 'Portugal', league: 'PL', uefa: null, stars: [{ id: 9097, name: 'Matheus Cunha', pos: 'Centre-Forward', nat: 'Brazil', num: 10, g: 11, a: 4, p: 0 }] },
  338: { id: 338, name: 'Leicester City FC', shortName: 'Leicester', tla: 'LEI', area: 'England', colors: ['#003090', '#FDBE11'], venue: 'King Power Stadium', founded: 1884, coach: 'Ruud van Nistelrooy', coachNat: 'Netherlands', league: 'PL', uefa: null, stars: [{ id: 9098, name: 'Jamie Vardy', pos: 'Centre-Forward', nat: 'England', num: 9, g: 7, a: 3, p: 1 }] },
  349: { id: 349, name: 'Ipswich Town FC', shortName: 'Ipswich', tla: 'IPS', area: 'England', colors: ['#3A64A3', '#FFFFFF'], venue: 'Portman Road', founded: 1878, coach: 'Kieran McKenna', coachNat: 'Northern Ireland', league: 'PL', uefa: null, stars: [{ id: 9099, name: 'Liam Delap', pos: 'Centre-Forward', nat: 'England', num: 19, g: 8, a: 2, p: 1 }] },
  340: { id: 340, name: 'Southampton FC', shortName: 'Southampton', tla: 'SOU', area: 'England', colors: ['#D71920', '#FFFFFF'], venue: "St Mary's Stadium", founded: 1885, coach: 'Ivan Jurić', coachNat: 'Croatia', league: 'PL', uefa: null, stars: [{ id: 9100, name: 'Tyler Dibling', pos: 'Right Winger', nat: 'England', num: 33, g: 4, a: 2, p: 0 }] },

  // === LA LIGA (PD) ===
  81: {
    id: 81, name: 'FC Barcelona', shortName: 'Barcelona', tla: 'FCB', area: 'Spain',
    colors: ['#A50044', '#004D98'], venue: 'Estadi Olímpic Lluís Companys', founded: 1899,
    coach: 'Hansi Flick', coachNat: 'Germany', league: 'PD', uefa: 'CL',
    stars: [
      { id: 9101, name: 'Robert Lewandowski', pos: 'Centre-Forward', nat: 'Poland', num: 9, g: 19, a: 3, p: 3 },
      { id: 9102, name: 'Raphinha', pos: 'Left Winger', nat: 'Brazil', num: 11, g: 13, a: 9, p: 1 },
      { id: 9103, name: 'Lamine Yamal', pos: 'Right Winger', nat: 'Spain', num: 19, g: 8, a: 12, p: 0 },
      { id: 9104, name: 'Pedri', pos: 'Central Midfield', nat: 'Spain', num: 8, g: 4, a: 6, p: 0 },
      { id: 9105, name: 'Pau Cubarsí', pos: 'Centre-Back', nat: 'Spain', num: 2, g: 0, a: 1, p: 0 },
      { id: 9106, name: 'Iñaki Peña', pos: 'Goalkeeper', nat: 'Spain', num: 13, g: 0, a: 0, p: 0 },
    ],
  },
  86: {
    id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', tla: 'RMA', area: 'Spain',
    colors: ['#FEBE10', '#00529F'], venue: 'Santiago Bernabéu', founded: 1902,
    coach: 'Carlo Ancelotti', coachNat: 'Italy', league: 'PD', uefa: 'CL',
    stars: [
      { id: 9111, name: 'Kylian Mbappé', pos: 'Centre-Forward', nat: 'France', num: 9, g: 17, a: 4, p: 4 },
      { id: 9112, name: 'Vinícius Júnior', pos: 'Left Winger', nat: 'Brazil', num: 7, g: 12, a: 8, p: 2 },
      { id: 9113, name: 'Jude Bellingham', pos: 'Attacking Midfield', nat: 'England', num: 5, g: 9, a: 7, p: 0 },
      { id: 9114, name: 'Federico Valverde', pos: 'Central Midfield', nat: 'Uruguay', num: 8, g: 6, a: 4, p: 0 },
      { id: 9115, name: 'Antonio Rüdiger', pos: 'Centre-Back', nat: 'Germany', num: 22, g: 2, a: 0, p: 0 },
      { id: 9116, name: 'Thibaut Courtois', pos: 'Goalkeeper', nat: 'Belgium', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  78: {
    id: 78, name: 'Club Atlético de Madrid', shortName: 'Atlético', tla: 'ATM', area: 'Spain',
    colors: ['#CB3524', '#272E61'], venue: 'Riyadh Air Metropolitano', founded: 1903,
    coach: 'Diego Simeone', coachNat: 'Argentina', league: 'PD', uefa: 'CL',
    stars: [
      { id: 9121, name: 'Julián Álvarez', pos: 'Centre-Forward', nat: 'Argentina', num: 19, g: 12, a: 4, p: 2 },
      { id: 9122, name: 'Antoine Griezmann', pos: 'Second Striker', nat: 'France', num: 7, g: 10, a: 7, p: 1 },
      { id: 9123, name: 'Jan Oblak', pos: 'Goalkeeper', nat: 'Slovenia', num: 13, g: 0, a: 0, p: 0 },
    ],
  },
  77: { id: 77, name: 'Athletic Club', shortName: 'Athletic', tla: 'ATH', area: 'Spain', colors: ['#EE2523', '#FFFFFF'], venue: 'San Mamés', founded: 1898, coach: 'Ernesto Valverde', coachNat: 'Spain', league: 'PD', uefa: 'EL', stars: [{ id: 9131, name: 'Oihan Sancet', pos: 'Attacking Midfield', nat: 'Spain', num: 8, g: 11, a: 3, p: 2 }, { id: 9132, name: 'Nico Williams', pos: 'Left Winger', nat: 'Spain', num: 10, g: 5, a: 6, p: 0 }] },
  94: { id: 94, name: 'Villarreal CF', shortName: 'Villarreal', tla: 'VIL', area: 'Spain', colors: ['#FBE100', '#005187'], venue: 'Estadio de la Cerámica', founded: 1923, coach: 'Marcelino', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9133, name: 'Ayoze Pérez', pos: 'Centre-Forward', nat: 'Spain', num: 22, g: 10, a: 2, p: 0 }] },
  92: { id: 92, name: 'Real Sociedad', shortName: 'Real Sociedad', tla: 'RSO', area: 'Spain', colors: ['#0067B1', '#FFFFFF'], venue: 'Reale Arena', founded: 1909, coach: 'Imanol Alguacil', coachNat: 'Spain', league: 'PD', uefa: 'EL', stars: [{ id: 9134, name: 'Takefusa Kubo', pos: 'Right Winger', nat: 'Japan', num: 14, g: 6, a: 4, p: 0 }] },
  90: { id: 90, name: 'Real Betis Balompié', shortName: 'Real Betis', tla: 'BET', area: 'Spain', colors: ['#00954C', '#FFFFFF'], venue: 'Benito Villamarín', founded: 1907, coach: 'Manuel Pellegrini', coachNat: 'Chile', league: 'PD', uefa: 'UCL', stars: [{ id: 9135, name: 'Giovani Lo Celso', pos: 'Attacking Midfield', nat: 'Argentina', num: 20, g: 7, a: 4, p: 2 }] },
  298: { id: 298, name: 'Girona FC', shortName: 'Girona', tla: 'GIR', area: 'Spain', colors: ['#CD2534', '#FFFFFF'], venue: 'Estadi Montilivi', founded: 1930, coach: 'Míchel', coachNat: 'Spain', league: 'PD', uefa: 'CL', stars: [{ id: 9136, name: 'Cristhian Stuani', pos: 'Centre-Forward', nat: 'Uruguay', num: 7, g: 6, a: 1, p: 2 }] },
  559: { id: 559, name: 'Sevilla FC', shortName: 'Sevilla', tla: 'SEV', area: 'Spain', colors: ['#D4021D', '#FFFFFF'], venue: 'Ramón Sánchez-Pizjuán', founded: 1890, coach: 'García Pimienta', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9137, name: 'Dodi Lukebakio', pos: 'Right Winger', nat: 'Belgium', num: 11, g: 9, a: 2, p: 1 }] },
  95: { id: 95, name: 'Valencia CF', shortName: 'Valencia', tla: 'VAL', area: 'Spain', colors: ['#FF6600', '#000000'], venue: 'Mestalla', founded: 1919, coach: 'Carlos Corberán', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9138, name: 'Hugo Duro', pos: 'Centre-Forward', nat: 'Spain', num: 9, g: 8, a: 2, p: 1 }] },
  79: { id: 79, name: 'CA Osasuna', shortName: 'Osasuna', tla: 'OSA', area: 'Spain', colors: ['#D91A21', '#0A346F'], venue: 'El Sadar', founded: 1920, coach: 'Vicente Moreno', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9139, name: 'Ante Budimir', pos: 'Centre-Forward', nat: 'Croatia', num: 17, g: 12, a: 2, p: 4 }] },
  89: { id: 89, name: 'RCD Mallorca', shortName: 'Mallorca', tla: 'MLL', area: 'Spain', colors: ['#E20613', '#000000'], venue: 'Son Moix', founded: 1916, coach: 'Jagoba Arrasate', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9140, name: 'Vedat Muriqi', pos: 'Centre-Forward', nat: 'Kosovo', num: 7, g: 6, a: 2, p: 1 }] },
  558: { id: 558, name: 'RC Celta de Vigo', shortName: 'Celta Vigo', tla: 'CEL', area: 'Spain', colors: ['#8AC3EE', '#FFFFFF'], venue: 'Balaídos', founded: 1923, coach: 'Claudio Giráldez', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9141, name: 'Iago Aspas', pos: 'Centre-Forward', nat: 'Spain', num: 10, g: 8, a: 4, p: 2 }] },
  87: { id: 87, name: 'Rayo Vallecano', shortName: 'Rayo', tla: 'RAY', area: 'Spain', colors: ['#E53027', '#FFFFFF'], venue: 'Vallecas', founded: 1924, coach: 'Iñigo Pérez', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9142, name: 'Isi Palazón', pos: 'Right Winger', nat: 'Spain', num: 7, g: 5, a: 4, p: 0 }] },
  82: { id: 82, name: 'Getafe CF', shortName: 'Getafe', tla: 'GET', area: 'Spain', colors: ['#005999', '#FFFFFF'], venue: 'Coliseum', founded: 1983, coach: 'José Bordalás', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9143, name: 'Mauro Arambarri', pos: 'Central Midfield', nat: 'Uruguay', num: 18, g: 5, a: 1, p: 1 }] },
  80: { id: 80, name: 'RCD Espanyol', shortName: 'Espanyol', tla: 'ESP', area: 'Spain', colors: ['#007FC8', '#FFFFFF'], venue: 'RCDE Stadium', founded: 1900, coach: 'Manolo González', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9144, name: 'Javi Puado', pos: 'Left Winger', nat: 'Spain', num: 7, g: 8, a: 2, p: 2 }] },
  263: { id: 263, name: 'Deportivo Alavés', shortName: 'Alavés', tla: 'ALA', area: 'Spain', colors: ['#0057B8', '#FFFFFF'], venue: 'Mendizorrotza', founded: 1921, coach: 'Eduardo Coudet', coachNat: 'Argentina', league: 'PD', uefa: null, stars: [{ id: 9145, name: 'Kike García', pos: 'Centre-Forward', nat: 'Spain', num: 17, g: 9, a: 1, p: 2 }] },
  275: { id: 275, name: 'UD Las Palmas', shortName: 'Las Palmas', tla: 'LPA', area: 'Spain', colors: ['#FFE400', '#00519E'], venue: 'Gran Canaria', founded: 1949, coach: 'Diego Martínez', coachNat: 'Spain', league: 'PD', uefa: null, stars: [{ id: 9146, name: 'Fábio Silva', pos: 'Centre-Forward', nat: 'Portugal', num: 37, g: 7, a: 2, p: 1 }] },

  // === SERIE A (SA) ===
  108: {
    id: 108, name: 'FC Internazionale Milano', shortName: 'Inter', tla: 'INT', area: 'Italy',
    colors: ['#010E80', '#000000'], venue: 'San Siro', founded: 1908,
    coach: 'Simone Inzaghi', coachNat: 'Italy', league: 'SA', uefa: 'CL',
    stars: [
      { id: 9201, name: 'Lautaro Martínez', pos: 'Centre-Forward', nat: 'Argentina', num: 10, g: 13, a: 5, p: 1 },
      { id: 9202, name: 'Marcus Thuram', pos: 'Centre-Forward', nat: 'France', num: 9, g: 14, a: 6, p: 0 },
      { id: 9203, name: 'Nicolò Barella', pos: 'Central Midfield', nat: 'Italy', num: 23, g: 4, a: 7, p: 0 },
      { id: 9204, name: 'Hakan Çalhanoğlu', pos: 'Defensive Midfield', nat: 'Turkey', num: 20, g: 6, a: 5, p: 4 },
      { id: 9205, name: 'Yann Sommer', pos: 'Goalkeeper', nat: 'Switzerland', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  113: {
    id: 113, name: 'SSC Napoli', shortName: 'Napoli', tla: 'NAP', area: 'Italy',
    colors: ['#12A0D7', '#FFFFFF'], venue: 'Stadio Diego Armando Maradona', founded: 1926,
    coach: 'Antonio Conte', coachNat: 'Italy', league: 'SA', uefa: null,
    stars: [
      { id: 9211, name: 'Romelu Lukaku', pos: 'Centre-Forward', nat: 'Belgium', num: 11, g: 10, a: 7, p: 2 },
      { id: 9212, name: 'Scott McTominay', pos: 'Central Midfield', nat: 'Scotland', num: 8, g: 7, a: 4, p: 0 },
      { id: 9213, name: 'Alex Meret', pos: 'Goalkeeper', nat: 'Italy', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  102: {
    id: 102, name: 'Atalanta BC', shortName: 'Atalanta', tla: 'ATA', area: 'Italy',
    colors: ['#1E71B8', '#000000'], venue: 'Gewiss Stadium', founded: 1907,
    coach: 'Gian Piero Gasperini', coachNat: 'Italy', league: 'SA', uefa: 'CL',
    stars: [
      { id: 9221, name: 'Mateo Retegui', pos: 'Centre-Forward', nat: 'Italy', num: 32, g: 17, a: 3, p: 3 },
      { id: 9222, name: 'Ademola Lookman', pos: 'Left Winger', nat: 'Nigeria', num: 11, g: 12, a: 6, p: 1 },
    ],
  },
  109: {
    id: 109, name: 'Juventus FC', shortName: 'Juventus', tla: 'JUV', area: 'Italy',
    colors: ['#000000', '#FFFFFF'], venue: 'Allianz Stadium', founded: 1897,
    coach: 'Thiago Motta', coachNat: 'Italy', league: 'SA', uefa: 'CL',
    stars: [
      { id: 9231, name: 'Dušan Vlahović', pos: 'Centre-Forward', nat: 'Serbia', num: 9, g: 11, a: 2, p: 3 },
      { id: 9232, name: 'Kenan Yıldız', pos: 'Left Winger', nat: 'Turkey', num: 10, g: 6, a: 5, p: 0 },
    ],
  },
  98: {
    id: 98, name: 'AC Milan', shortName: 'AC Milan', tla: 'MIL', area: 'Italy',
    colors: ['#FB090B', '#000000'], venue: 'San Siro', founded: 1899,
    coach: 'Sérgio Conceição', coachNat: 'Portugal', league: 'SA', uefa: 'CL',
    stars: [
      { id: 9241, name: 'Christian Pulisic', pos: 'Right Winger', nat: 'USA', num: 11, g: 9, a: 6, p: 2 },
      { id: 9242, name: 'Rafael Leão', pos: 'Left Winger', nat: 'Portugal', num: 10, g: 7, a: 6, p: 0 },
      { id: 9243, name: 'Tijjani Reijnders', pos: 'Central Midfield', nat: 'Netherlands', num: 14, g: 8, a: 3, p: 0 },
    ],
  },
  110: { id: 110, name: 'SS Lazio', shortName: 'Lazio', tla: 'LAZ', area: 'Italy', colors: ['#87D8F7', '#FFFFFF'], venue: 'Stadio Olimpico', founded: 1900, coach: 'Marco Baroni', coachNat: 'Italy', league: 'SA', uefa: 'EL', stars: [{ id: 9251, name: 'Valentín Castellanos', pos: 'Centre-Forward', nat: 'Argentina', num: 11, g: 10, a: 4, p: 1 }] },
  99: { id: 99, name: 'ACF Fiorentina', shortName: 'Fiorentina', tla: 'FIO', area: 'Italy', colors: ['#482E92', '#FFFFFF'], venue: 'Artemio Franchi', founded: 1926, coach: 'Raffaele Palladino', coachNat: 'Italy', league: 'SA', uefa: 'UCL', stars: [{ id: 9252, name: 'Moise Kean', pos: 'Centre-Forward', nat: 'Italy', num: 20, g: 15, a: 2, p: 1 }] },
  100: { id: 100, name: 'AS Roma', shortName: 'AS Roma', tla: 'ROM', area: 'Italy', colors: ['#8E1F2F', '#F0BC42'], venue: 'Stadio Olimpico', founded: 1927, coach: 'Claudio Ranieri', coachNat: 'Italy', league: 'SA', uefa: 'EL', stars: [{ id: 9253, name: 'Paulo Dybala', pos: 'Attacking Midfield', nat: 'Argentina', num: 21, g: 8, a: 5, p: 2 }] },
  103: { id: 103, name: 'Bologna FC 1909', shortName: 'Bologna', tla: 'BOL', area: 'Italy', colors: ['#1A2F48', '#A21C26'], venue: 'Renato Dall\'Ara', founded: 1909, coach: 'Vincenzo Italiano', coachNat: 'Italy', league: 'SA', uefa: 'CL', stars: [{ id: 9254, name: 'Riccardo Orsolini', pos: 'Right Winger', nat: 'Italy', num: 7, g: 9, a: 3, p: 2 }] },
  586: { id: 586, name: 'Torino FC', shortName: 'Torino', tla: 'TOR', area: 'Italy', colors: ['#8A1E03', '#FFFFFF'], venue: 'Olimpico Grande Torino', founded: 1906, coach: 'Paolo Vanoli', coachNat: 'Italy', league: 'SA', uefa: null, stars: [{ id: 9255, name: 'Ché Adams', pos: 'Centre-Forward', nat: 'Scotland', num: 18, g: 8, a: 3, p: 0 }] },
  115: { id: 115, name: 'Udinese Calcio', shortName: 'Udinese', tla: 'UDI', area: 'Italy', colors: ['#000000', '#FFFFFF'], venue: 'Bluenergy Stadium', founded: 1896, coach: 'Kosta Runjaić', coachNat: 'Germany', league: 'SA', uefa: null, stars: [{ id: 9256, name: 'Lorenzo Lucca', pos: 'Centre-Forward', nat: 'Italy', num: 17, g: 9, a: 1, p: 0 }] },
  107: { id: 107, name: 'Genoa CFC', shortName: 'Genoa', tla: 'GEN', area: 'Italy', colors: ['#991427', '#04274A'], venue: 'Luigi Ferraris', founded: 1893, coach: 'Patrick Vieira', coachNat: 'France', league: 'SA', uefa: null, stars: [{ id: 9257, name: 'Andrea Pinamonti', pos: 'Centre-Forward', nat: 'Italy', num: 19, g: 7, a: 1, p: 1 }] },
  104: { id: 104, name: 'Cagliari Calcio', shortName: 'Cagliari', tla: 'CAG', area: 'Italy', colors: ['#9B0027', '#002350'], venue: 'Unipol Domus', founded: 1920, coach: 'Davide Nicola', coachNat: 'Italy', league: 'SA', uefa: null, stars: [{ id: 9258, name: 'Roberto Piccoli', pos: 'Centre-Forward', nat: 'Italy', num: 91, g: 6, a: 2, p: 1 }] },
  450: { id: 450, name: 'Hellas Verona FC', shortName: 'Verona', tla: 'VER', area: 'Italy', colors: ['#005395', '#FFE500'], venue: 'Marcantonio Bentegodi', founded: 1903, coach: 'Paolo Zanetti', coachNat: 'Italy', league: 'SA', uefa: null, stars: [{ id: 9259, name: 'Casper Tengstedt', pos: 'Centre-Forward', nat: 'Denmark', num: 11, g: 6, a: 1, p: 1 }] },

  // === BUNDESLIGA (BL1) ===
  5: {
    id: 5, name: 'FC Bayern München', shortName: 'Bayern', tla: 'FCB', area: 'Germany',
    colors: ['#DC052D', '#0066B2'], venue: 'Allianz Arena', founded: 1900,
    coach: 'Vincent Kompany', coachNat: 'Belgium', league: 'BL1', uefa: 'CL',
    stars: [
      { id: 9301, name: 'Harry Kane', pos: 'Centre-Forward', nat: 'England', num: 9, g: 21, a: 6, p: 7 },
      { id: 9302, name: 'Jamal Musiala', pos: 'Attacking Midfield', nat: 'Germany', num: 42, g: 11, a: 5, p: 0 },
      { id: 9303, name: 'Michael Olise', pos: 'Right Winger', nat: 'France', num: 17, g: 8, a: 8, p: 0 },
      { id: 9304, name: 'Joshua Kimmich', pos: 'Defensive Midfield', nat: 'Germany', num: 6, g: 2, a: 7, p: 0 },
      { id: 9305, name: 'Manuel Neuer', pos: 'Goalkeeper', nat: 'Germany', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  3: {
    id: 3, name: 'Bayer 04 Leverkusen', shortName: 'Leverkusen', tla: 'B04', area: 'Germany',
    colors: ['#E32221', '#000000'], venue: 'BayArena', founded: 1904,
    coach: 'Xabi Alonso', coachNat: 'Spain', league: 'BL1', uefa: 'CL',
    stars: [
      { id: 9311, name: 'Florian Wirtz', pos: 'Attacking Midfield', nat: 'Germany', num: 10, g: 10, a: 9, p: 1 },
      { id: 9312, name: 'Patrik Schick', pos: 'Centre-Forward', nat: 'Czechia', num: 14, g: 14, a: 1, p: 0 },
      { id: 9313, name: 'Granit Xhaka', pos: 'Defensive Midfield', nat: 'Switzerland', num: 34, g: 2, a: 6, p: 0 },
    ],
  },
  19: {
    id: 19, name: 'Eintracht Frankfurt', shortName: 'Frankfurt', tla: 'SGE', area: 'Germany',
    colors: ['#E1000F', '#000000'], venue: 'Deutsche Bank Park', founded: 1899,
    coach: 'Dino Toppmöller', coachNat: 'Germany', league: 'BL1', uefa: 'EL',
    stars: [
      { id: 9321, name: 'Hugo Ekitiké', pos: 'Centre-Forward', nat: 'France', num: 11, g: 12, a: 5, p: 1 },
      { id: 9322, name: 'Omar Marmoush', pos: 'Centre-Forward', nat: 'Egypt', num: 7, g: 15, a: 9, p: 2 },
    ],
  },
  721: { id: 721, name: 'RB Leipzig', shortName: 'RB Leipzig', tla: 'RBL', area: 'Germany', colors: ['#DD0741', '#001F47'], venue: 'Red Bull Arena', founded: 2009, coach: 'Marco Rose', coachNat: 'Germany', league: 'BL1', uefa: 'CL', stars: [{ id: 9331, name: 'Benjamin Šeško', pos: 'Centre-Forward', nat: 'Slovenia', num: 30, g: 11, a: 3, p: 1 }, { id: 9332, name: 'Xavi Simons', pos: 'Attacking Midfield', nat: 'Netherlands', num: 10, g: 6, a: 5, p: 0 }] },
  4: { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', tla: 'BVB', area: 'Germany', colors: ['#FDE100', '#000000'], venue: 'Signal Iduna Park', founded: 1909, coach: 'Niko Kovač', coachNat: 'Croatia', league: 'BL1', uefa: 'CL', stars: [{ id: 9341, name: 'Serhou Guirassy', pos: 'Centre-Forward', nat: 'Guinea', num: 9, g: 14, a: 3, p: 3 }, { id: 9342, name: 'Jamie Gittens', pos: 'Left Winger', nat: 'England', num: 43, g: 7, a: 4, p: 0 }] },
  10: { id: 10, name: 'VfB Stuttgart', shortName: 'Stuttgart', tla: 'VFB', area: 'Germany', colors: ['#E32219', '#FFFFFF'], venue: 'MHPArena', founded: 1893, coach: 'Sebastian Hoeneß', coachNat: 'Germany', league: 'BL1', uefa: 'CL', stars: [{ id: 9351, name: 'Ermedin Demirović', pos: 'Centre-Forward', nat: 'Bosnia', num: 9, g: 9, a: 2, p: 1 }] },
  15: { id: 15, name: '1. FSV Mainz 05', shortName: 'Mainz 05', tla: 'M05', area: 'Germany', colors: ['#C3141E', '#FFFFFF'], venue: 'Mewa Arena', founded: 1905, coach: 'Bo Henriksen', coachNat: 'Denmark', league: 'BL1', uefa: null, stars: [{ id: 9352, name: 'Jonathan Burkardt', pos: 'Centre-Forward', nat: 'Germany', num: 29, g: 13, a: 2, p: 1 }] },
  17: { id: 17, name: 'SC Freiburg', shortName: 'Freiburg', tla: 'SCF', area: 'Germany', colors: ['#DF0117', '#000000'], venue: 'Europa-Park Stadion', founded: 1904, coach: 'Julian Schuster', coachNat: 'Germany', league: 'BL1', uefa: null, stars: [{ id: 9353, name: 'Vincenzo Grifo', pos: 'Left Winger', nat: 'Italy', num: 32, g: 7, a: 7, p: 2 }] },
  11: { id: 11, name: 'VfL Wolfsburg', shortName: 'Wolfsburg', tla: 'WOB', area: 'Germany', colors: ['#65B32E', '#FFFFFF'], venue: 'Volkswagen Arena', founded: 1945, coach: 'Ralph Hasenhüttl', coachNat: 'Austria', league: 'BL1', uefa: null, stars: [{ id: 9354, name: 'Mohamed Amoura', pos: 'Centre-Forward', nat: 'Algeria', num: 9, g: 9, a: 7, p: 0 }] },
  18: { id: 18, name: 'Borussia Mönchengladbach', shortName: 'Gladbach', tla: 'BMG', area: 'Germany', colors: ['#000000', '#FFFFFF'], venue: 'Borussia-Park', founded: 1900, coach: 'Gerardo Seoane', coachNat: 'Switzerland', league: 'BL1', uefa: null, stars: [{ id: 9355, name: 'Tim Kleindienst', pos: 'Centre-Forward', nat: 'Germany', num: 11, g: 13, a: 5, p: 1 }] },
  12: { id: 12, name: 'SV Werder Bremen', shortName: 'Bremen', tla: 'SVW', area: 'Germany', colors: ['#1D9053', '#FFFFFF'], venue: 'Weserstadion', founded: 1899, coach: 'Ole Werner', coachNat: 'Germany', league: 'BL1', uefa: null, stars: [{ id: 9356, name: 'Marvin Ducksch', pos: 'Centre-Forward', nat: 'Germany', num: 7, g: 7, a: 6, p: 2 }] },
  16: { id: 16, name: 'FC Augsburg', shortName: 'Augsburg', tla: 'FCA', area: 'Germany', colors: ['#BA3733', '#FFFFFF'], venue: 'WWK Arena', founded: 1907, coach: 'Jess Thorup', coachNat: 'Denmark', league: 'BL1', uefa: null, stars: [{ id: 9357, name: 'Alexis Claude-Maurice', pos: 'Attacking Midfield', nat: 'France', num: 20, g: 8, a: 2, p: 0 }] },

  // === LIGUE 1 (FL1) ===
  524: {
    id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', tla: 'PSG', area: 'France',
    colors: ['#004170', '#DA291C'], venue: 'Parc des Princes', founded: 1970,
    coach: 'Luis Enrique', coachNat: 'Spain', league: 'FL1', uefa: 'CL',
    stars: [
      { id: 9401, name: 'Ousmane Dembélé', pos: 'Right Winger', nat: 'France', num: 10, g: 16, a: 6, p: 1 },
      { id: 9402, name: 'Bradley Barcola', pos: 'Left Winger', nat: 'France', num: 29, g: 12, a: 7, p: 0 },
      { id: 9403, name: 'Vitinha', pos: 'Central Midfield', nat: 'Portugal', num: 17, g: 5, a: 4, p: 2 },
      { id: 9404, name: 'Gianluigi Donnarumma', pos: 'Goalkeeper', nat: 'Italy', num: 1, g: 0, a: 0, p: 0 },
    ],
  },
  516: {
    id: 516, name: 'Olympique de Marseille', shortName: 'Marseille', tla: 'OM', area: 'France',
    colors: ['#2FAEE0', '#FFFFFF'], venue: 'Stade Vélodrome', founded: 1899,
    coach: 'Roberto De Zerbi', coachNat: 'Italy', league: 'FL1', uefa: null,
    stars: [
      { id: 9411, name: 'Mason Greenwood', pos: 'Right Winger', nat: 'England', num: 10, g: 14, a: 4, p: 4 },
      { id: 9412, name: 'Adrien Rabiot', pos: 'Central Midfield', nat: 'France', num: 25, g: 5, a: 3, p: 0 },
    ],
  },
  548: {
    id: 548, name: 'AS Monaco FC', shortName: 'Monaco', tla: 'ASM', area: 'France',
    colors: ['#E51B24', '#FFFFFF'], venue: 'Stade Louis-II', founded: 1924,
    coach: 'Adi Hütter', coachNat: 'Austria', league: 'FL1', uefa: 'CL',
    stars: [
      { id: 9421, name: 'Mika Biereth', pos: 'Centre-Forward', nat: 'Denmark', num: 14, g: 10, a: 2, p: 0 },
      { id: 9422, name: 'Maghnes Akliouche', pos: 'Attacking Midfield', nat: 'France', num: 11, g: 5, a: 6, p: 0 },
    ],
  },
  521: { id: 521, name: 'Lille OSC', shortName: 'Lille', tla: 'LIL', area: 'France', colors: ['#E01E13', '#232544'], venue: 'Stade Pierre-Mauroy', founded: 1944, coach: 'Bruno Génésio', coachNat: 'France', league: 'FL1', uefa: 'CL', stars: [{ id: 9431, name: 'Jonathan David', pos: 'Centre-Forward', nat: 'Canada', num: 9, g: 14, a: 4, p: 5 }] },
  522: { id: 522, name: 'OGC Nice', shortName: 'Nice', tla: 'NIC', area: 'France', colors: ['#CC0000', '#000000'], venue: 'Allianz Riviera', founded: 1904, coach: 'Franck Haise', coachNat: 'France', league: 'FL1', uefa: 'EL', stars: [{ id: 9441, name: 'Evann Guessand', pos: 'Centre-Forward', nat: 'Ivory Coast', num: 29, g: 10, a: 6, p: 0 }] },
  523: { id: 523, name: 'Olympique Lyonnais', shortName: 'Lyon', tla: 'OL', area: 'France', colors: ['#14387F', '#DA291C'], venue: 'Groupama Stadium', founded: 1950, coach: 'Paulo Fonseca', coachNat: 'Portugal', league: 'FL1', uefa: 'EL', stars: [{ id: 9451, name: 'Alexandre Lacazette', pos: 'Centre-Forward', nat: 'France', num: 10, g: 10, a: 2, p: 3 }] },
  576: { id: 576, name: 'RC Strasbourg Alsace', shortName: 'Strasbourg', tla: 'RCS', area: 'France', colors: ['#009FE3', '#FFFFFF'], venue: 'Stade de la Meinau', founded: 1906, coach: 'Liam Rosenior', coachNat: 'England', league: 'FL1', uefa: null, stars: [{ id: 9452, name: 'Emanuel Emegha', pos: 'Centre-Forward', nat: 'Netherlands', num: 10, g: 11, a: 2, p: 0 }] },
  546: { id: 546, name: 'RC Lens', shortName: 'Lens', tla: 'RCL', area: 'France', colors: ['#EC1C24', '#FFE600'], venue: 'Stade Bollaert-Delelis', founded: 1906, coach: 'Will Still', coachNat: 'Belgium', league: 'FL1', uefa: null, stars: [{ id: 9453, name: 'M\'Bala Nzola', pos: 'Centre-Forward', nat: 'Angola', num: 8, g: 6, a: 1, p: 2 }] },
  512: { id: 512, name: 'Stade Brestois 29', shortName: 'Brest', tla: 'SB29', area: 'France', colors: ['#E2001A', '#FFFFFF'], venue: 'Stade Francis-Le Blé', founded: 1950, coach: 'Éric Roy', coachNat: 'France', league: 'FL1', uefa: 'CL', stars: [{ id: 9454, name: 'Ludovic Ajorque', pos: 'Centre-Forward', nat: 'France', num: 19, g: 10, a: 3, p: 0 }] },
  511: { id: 511, name: 'Toulouse FC', shortName: 'Toulouse', tla: 'TFC', area: 'France', colors: ['#5B2B82', '#FFFFFF'], venue: 'Stadium de Toulouse', founded: 1970, coach: 'Carles Martínez', coachNat: 'Spain', league: 'FL1', uefa: null, stars: [{ id: 9455, name: 'Zakaria Aboukhlal', pos: 'Right Winger', nat: 'Morocco', num: 7, g: 7, a: 2, p: 2 }] },

  // === ADDITIONAL EUROPEAN CLUBS (FOR EL & UCL DEPTH) ===
  503: { id: 503, name: 'FC Porto', shortName: 'Porto', tla: 'FCP', area: 'Portugal', colors: ['#00428C', '#FFFFFF'], venue: 'Estádio do Dragão', founded: 1893, coach: 'Martín Anselmi', coachNat: 'Argentina', league: null, uefa: 'EL', stars: [{ id: 9501, name: 'Samu Aghehowa', pos: 'Centre-Forward', nat: 'Spain', num: 9, g: 14, a: 2, p: 1 }] },
  678: { id: 678, name: 'AFC Ajax', shortName: 'Ajax', tla: 'AJX', area: 'Netherlands', colors: ['#D2122E', '#FFFFFF'], venue: 'Johan Cruijff ArenA', founded: 1900, coach: 'Francesco Farioli', coachNat: 'Italy', league: null, uefa: 'EL', stars: [{ id: 9502, name: 'Kenneth Taylor', pos: 'Central Midfield', nat: 'Netherlands', num: 8, g: 8, a: 5, p: 2 }] },
  675: { id: 675, name: 'Feyenoord Rotterdam', shortName: 'Feyenoord', tla: 'FEY', area: 'Netherlands', colors: ['#EE1C25', '#FFFFFF'], venue: 'De Kuip', founded: 1908, coach: 'Robin van Persie', coachNat: 'Netherlands', league: null, uefa: 'CL', stars: [{ id: 9503, name: 'Igor Paixão', pos: 'Left Winger', nat: 'Brazil', num: 14, g: 9, a: 8, p: 0 }] },
  1903: { id: 1903, name: 'SL Benfica', shortName: 'Benfica', tla: 'SLB', area: 'Portugal', colors: ['#E83030', '#FFFFFF'], venue: 'Estádio da Luz', founded: 1904, coach: 'Bruno Lage', coachNat: 'Portugal', league: null, uefa: 'CL', stars: [{ id: 9504, name: 'Vangelis Pavlidis', pos: 'Centre-Forward', nat: 'Greece', num: 14, g: 12, a: 4, p: 2 }] },
  610: { id: 610, name: 'Galatasaray SK', shortName: 'Galatasaray', tla: 'GAL', area: 'Turkey', colors: ['#A90432', '#FDB912'], venue: 'RAMS Park', founded: 1905, coach: 'Okan Buruk', coachNat: 'Turkey', league: null, uefa: 'EL', stars: [{ id: 9505, name: 'Victor Osimhen', pos: 'Centre-Forward', nat: 'Nigeria', num: 45, g: 15, a: 5, p: 3 }] },
  613: { id: 613, name: 'Fenerbahçe SK', shortName: 'Fenerbahçe', tla: 'FEN', area: 'Turkey', colors: ['#FFED00', '#00205B'], venue: 'Şükrü Saracoğlu', founded: 1907, coach: 'José Mourinho', coachNat: 'Portugal', league: null, uefa: 'EL', stars: [{ id: 9506, name: 'Youssef En-Nesyri', pos: 'Centre-Forward', nat: 'Morocco', num: 19, g: 14, a: 3, p: 0 }] },
  1876: { id: 1876, name: 'FC København', shortName: 'Copenhagen', tla: 'FCK', area: 'Denmark', colors: ['#0053A0', '#FFFFFF'], venue: 'Parken Stadium', founded: 1992, coach: 'Jacob Neestrup', coachNat: 'Denmark', league: null, uefa: 'UCL', stars: [{ id: 9507, name: 'Mohamed Elyounoussi', pos: 'Left Winger', nat: 'Norway', num: 10, g: 8, a: 6, p: 0 }] },
  851: { id: 851, name: 'Club Brugge KV', shortName: 'Club Brugge', tla: 'CLU', area: 'Belgium', colors: ['#005B9A', '#000000'], venue: 'Jan Breydel Stadium', founded: 1891, coach: 'Nicky Hayen', coachNat: 'Belgium', league: null, uefa: 'CL', stars: [{ id: 9508, name: 'Christos Tzolis', pos: 'Left Winger', nat: 'Greece', num: 8, g: 9, a: 5, p: 1 }] },
  755: { id: 755, name: 'Panathinaikos FC', shortName: 'Panathinaikos', tla: 'PAO', area: 'Greece', colors: ['#007A33', '#FFFFFF'], venue: 'OAKA Spiros Louis', founded: 1908, coach: 'Rui Vitória', coachNat: 'Portugal', league: null, uefa: 'UCL', stars: [{ id: 9509, name: 'Fotis Ioannidis', pos: 'Centre-Forward', nat: 'Greece', num: 7, g: 8, a: 2, p: 2 }] },
  1887: { id: 1887, name: 'Legia Warszawa', shortName: 'Legia', tla: 'LEG', area: 'Poland', colors: ['#008844', '#FFFFFF'], venue: 'Stadion Wojska Polskiego', founded: 1916, coach: 'Gonçalo Feio', coachNat: 'Portugal', league: null, uefa: 'UCL', stars: [{ id: 9510, name: 'Marc Gual', pos: 'Centre-Forward', nat: 'Spain', num: 28, g: 9, a: 3, p: 1 }] },
  583: { id: 583, name: 'Vitória SC', shortName: 'Vitória SC', tla: 'VSC', area: 'Portugal', colors: ['#111111', '#FFFFFF'], venue: 'Estádio D. Afonso Henriques', founded: 1922, coach: 'Luís Freire', coachNat: 'Portugal', league: null, uefa: 'UCL', stars: [{ id: 9511, name: 'Tiago Silva', pos: 'Central Midfield', nat: 'Portugal', num: 10, g: 6, a: 5, p: 2 }] },
  732: { id: 732, name: 'Celtic FC', shortName: 'Celtic', tla: 'CEL', area: 'Scotland', colors: ['#018749', '#FFFFFF'], venue: 'Celtic Park', founded: 1887, coach: 'Brendan Rodgers', coachNat: 'Northern Ireland', league: null, uefa: 'CL', stars: [{ id: 9512, name: 'Daizen Maeda', pos: 'Left Winger', nat: 'Japan', num: 38, g: 13, a: 5, p: 0 }] },
  247: { id: 247, name: 'SK Rapid Wien', shortName: 'Rapid Wien', tla: 'SCR', area: 'Austria', colors: ['#008247', '#FFFFFF'], venue: 'Allianz Stadion', founded: 1899, coach: 'Robert Klauß', coachNat: 'Germany', league: null, uefa: 'UCL', stars: [{ id: 9513, name: 'Dion Beljo', pos: 'Centre-Forward', nat: 'Croatia', num: 7, g: 10, a: 2, p: 1 }] },
  1894: { id: 1894, name: 'Molde FK', shortName: 'Molde', tla: 'MOL', area: 'Norway', colors: ['#00529B', '#FFFFFF'], venue: 'Aker Stadion', founded: 1911, coach: 'Per-Mathias Høgmo', coachNat: 'Norway', league: null, uefa: 'UCL', stars: [{ id: 9514, name: 'Magnus Wolff Eikrem', pos: 'Attacking Midfield', nat: 'Norway', num: 7, g: 7, a: 8, p: 0 }] },
};

// Ordered rankings per competition for generating coherent standings & matches
const COMPETITION_ROSTERS = {
  PL: [64, 57, 351, 61, 65, 67, 1044, 58, 63, 397, 402, 73, 66, 354, 563, 62, 76, 338, 349, 340],
  PD: [81, 86, 78, 77, 94, 90, 87, 92, 298, 79, 89, 558, 559, 82, 95, 80, 263, 275],
  SA: [108, 113, 102, 109, 110, 99, 98, 103, 100, 115, 586, 107, 104, 450],
  BL1: [5, 3, 19, 721, 15, 17, 10, 11, 18, 4, 12, 16],
  FL1: [524, 516, 548, 522, 521, 523, 576, 546, 512, 511],
  CL: [64, 81, 57, 108, 78, 3, 5, 86, 58, 521, 4, 102, 109, 524, 98, 548, 675, 1903, 851, 732, 65, 512],
  EL: [110, 77, 66, 73, 19, 523, 678, 503, 92, 610, 613, 100, 522],
  UCL: [61, 583, 99, 247, 1887, 90, 1876, 755, 1894],
};

module.exports = {
  CLUBS,
  COMPETITION_ROSTERS,
};
