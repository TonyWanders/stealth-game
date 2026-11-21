// Nightshift: The Meridian Vault - shared tuning constants.
// A top-down stealth game: slip past patrolling guards, grab the intel,
// reach the exit unseen. All values are in pixels and seconds.
export const TILE = 32;
export const VIEW_W = 960;
export const VIEW_H = 640;
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 11,
  walkSpeed: 132,
  sneakSpeed: 72,
  runSpeed: 178,
  noiseWalk: 52,
  noiseSneak: 16,
  noiseRun: 110,
};

export const GUARD = {
  radius: 12,
  patrolSpeed: 58,
  chaseSpeed: 128,
  searchSpeed: 82,
  viewRange: 185,
  viewHalfAngle: 0.62,
  hearRange: 120,
  suspicionRate: 1.35,
  suspicionClose: 2.4,
  suspicionDecay: 0.55,
  catchRange: 20,
  memorySeconds: 6,
};

export const GAME = {
  intelPerLevel: 3,
  maxAlerts: 3,
  distractCount: 3,
  distractRadius: 130,
};

export const COLORS = {
  floorA: '#20242e',
  floorB: '#232833',
  floorLine: '#2b313e',
  wall: '#3a4152',
  wallTop: '#565f73',
  crate: '#6b5233',
  crateTop: '#8a6a42',
  bush: '#1e4d2b',
  bushLeaf: '#2f6b3c',
  shadow: '#141821',
  exit: '#2fd67a',
  intel: '#ffd34d',
  player: '#37d6e0',
  guard: '#ff5a4e',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneEdge: 'rgba(255, 214, 90, 0.45)',
  coneAlert: 'rgba(255, 70, 50, 0.30)',
};
