// Nightshift: The Meridian Vault - the three levels.
// Tile legend: # wall, . floor, C crate (blocks sight and movement),
// B bush (walk in, guards cannot see you), P player start, E exit, I intel.
// Every map is 30 tiles wide and 20 tiles tall. Guard paths are tile cells.
export const LEVELS = [
  {
    name: 'The Meridian Vault',
    subtitle: 'Ground floor. Three guards, one way in, one way out.',
    seed: 11,
    shadows: [
      { x: 12, y: 6, w: 6, h: 3 },
      { x: 2, y: 16, w: 5, h: 2 },
    ],
    guards: [
      { path: [[3, 7], [26, 7]], pause: 1.2 },
      { path: [[26, 8], [3, 8]], pause: 1.2 },
      { path: [[5, 16], [24, 16]], pause: 0.8 },
    ],
    map: [
      '##############################',
      '#P....#.......#......#....I..#',
      '#.....#...C...#..B...#.......#',
      '#..C..#.......#......#...C...#',
      '#.....#.......#......#.......#',
      '#.....####.####.######..##...#',
      '#............................#',
      '#..B......C.......C......B...#',
      '#............................#',
      '####.######.#####.#####.######',
      '#......#........#.....#......#',
      '#..I...#...C....#..B..#..C...#',
      '#......#........#.....#......#',
      '#..C...#....B...#.....#......#',
      '#......#........#..C..#..I...#',
      '####.######.#####.#####.######',
      '#............................#',
      '#...C.......B.......C.....B..#',
      '#....E.......................#',
      '##############################',
    ],
  },
  {
    name: 'The Gallery',
    subtitle: 'Four guards walk the long halls. Mind the open floor.',
    seed: 23,
    shadows: [
      { x: 1, y: 6, w: 6, h: 3 },
      { x: 23, y: 6, w: 6, h: 3 },
      { x: 12, y: 17, w: 6, h: 1 },
    ],
    guards: [
      { path: [[2, 7], [27, 7]], pause: 0.9 },
      { path: [[27, 9], [2, 9]], pause: 0.9 },
      { path: [[2, 6], [2, 9]], pause: 1.5 },
      { path: [[14, 17], [27, 17]], pause: 0.7 },
    ],
    map: [
      '##############################',
      '#P...C....#.....B....#....I..#',
      '#.........#..........#.......#',
      '#..B......#....C.....#...C...#',
      '#.........#..........#.......#',
      '###.#######.######.#####.###.#',
      '#......C..........B..........#',
      '#............................#',
      '#..C....B....C......B....C...#',
      '#............................#',
      '#####.####.######.####.#####.#',
      '#....#......#.......#........#',
      '#.I..#..C...#...B...#...C.I..#',
      '#...........#.......#........#',
      '#.C..#..B...#...C...#...B....#',
      '#....#......#.......#........#',
      '#####.####.######.####.###.#.#',
      '#............................#',
      '#..B.....C......B.....C..E...#',
      '##############################',
    ],
  },
  {
    name: "The Director's Wing",
    subtitle: 'Five guards, tight rooms, no room for mistakes.',
    seed: 37,
    shadows: [
      { x: 9, y: 6, w: 5, h: 3 },
      { x: 20, y: 6, w: 5, h: 3 },
      { x: 1, y: 17, w: 6, h: 1 },
    ],
    guards: [
      { path: [[2, 7], [14, 7], [14, 9], [2, 9]], pause: 0.8 },
      { path: [[27, 7], [15, 7], [15, 9], [27, 9]], pause: 0.8 },
      { path: [[7, 6], [7, 9]], pause: 1.4 },
      { path: [[22, 6], [22, 9]], pause: 1.4 },
      { path: [[4, 17], [25, 17]], pause: 0.6 },
    ],
    map: [
      '##############################',
      '#P....#....C...#.....#....I..#',
      '#.....#........#..B..#.......#',
      '#..C..#...B....#.....#...C...#',
      '#.....#........#.....#.......#',
      '##.#####.#######.#####.####.##',
      '#.......C.....B......C.......#',
      '#..B....................B....#',
      '#......C......C......C.......#',
      '#............................#',
      '####.#####.######.####.#####.#',
      '#...#............#....#......#',
      '#.I.#..C..#..B...#..C.#..I...#',
      '#.........#......#....#......#',
      '#.C.#..B..#..C......B.#..C...#',
      '#...#.....#......#...........#',
      '####.#####.######.####.###.#.#',
      '#............................#',
      '#.B....C.....B......C....E...#',
      '##############################',
    ],
  },
];

// Parse one level map into walls, crates, bushes, intel spots, start and exit.
export function parseLevel(def) {
  const walls = [];
  const crates = [];
  const bushes = [];
  const intel = [];
  let start = null;
  let exit = null;
  def.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const ch = row[x];
      if (ch === '#') walls.push({ x, y });
      else if (ch === 'C') crates.push({ x, y });
      else if (ch === 'B') bushes.push({ x, y });
      else if (ch === 'I') intel.push({ x, y, taken: false });
      else if (ch === 'P') start = { x, y };
      else if (ch === 'E') exit = { x, y };
    }
  });
  return { def, walls, crates, bushes, intel, start, exit };
}

// Is the tile at (x, y) solid for walking: wall or crate.
export function isSolidTile(parsed, x, y) {
  if (x < 0 || y < 0 || y >= parsed.def.map.length || x >= parsed.def.map[0].length) return true;
  const ch = parsed.def.map[y][x];
  return ch === '#' || ch === 'C';
}

// Is the tile at (x, y) a bush the player can hide in.
export function isBushTile(parsed, x, y) {
  if (x < 0 || y < 0 || y >= parsed.def.map.length || x >= parsed.def.map[0].length) return false;
  return parsed.def.map[y][x] === 'B';
}

// Is the tile at (x, y) inside a shadow zone (detection grows slower there).
export function isShadowTile(parsed, x, y) {
  return parsed.def.shadows.some((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
}
