// Nightshift: The Meridian Vault - guard AI.
// A guard walks its patrol, pauses at each waypoint, and watches a vision
// cone. Spotting the player raises suspicion; a full meter means a chase.
// Lose the player and the guard searches the last seen spot, then goes back
// to patrol. Loud noises pull a guard to investigate.
import { TILE, GUARD } from './config.js';
import { isSolidTile } from './level.js';

export const STATE_PATROL = 'patrol';
export const STATE_CHASE = 'chase';
export const STATE_SEARCH = 'search';
export const STATE_RETURN = 'return';

export function makeGuard(def, parsed) {
  const first = def.path[0];
  return {
    path: def.path,
    pause: def.pause || 1,
    x: (first[0] + 0.5) * TILE,
    y: (first[1] + 0.5) * TILE,
    dir: 0,
    waypoint: 1 % def.path.length,
    pauseLeft: 0,
    state: STATE_PATROL,
    suspicion: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    loseTimer: 0,
    searchTimer: 0,
    heardX: 0,
    heardY: 0,
    stepPhase: 0,
    parsed,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.dir = Math.atan2(dy, dx);
  guard.stepPhase += step / 12;
  return dist - step < 2;
}

// True when no wall or crate stands between the guard and (x, y).
export function hasLineOfSight(guard, x, y) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const px = guard.x + (dx * i) / steps;
    const py = guard.y + (dy * i) / steps;
    if (isSolidTile(guard.parsed, Math.floor(px / TILE), Math.floor(py / TILE))) return false;
  }
  return true;
}

// How clearly this guard sees the player right now, 0 to 1.
export function seePlayer(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.viewRange) return 0;
  if (player.hidden && dist > 42) return 0;
  const angle = Math.atan2(dy, dx);
  const diff = Math.abs(angleDiff(angle, guard.dir));
  const half = GUARD.viewHalfAngle * (player.sneaking ? 0.75 : 1);
  if (dist > 34 && diff > half) return 0;
  if (!hasLineOfSight(guard, player.x, player.y)) return 0;
  const closeness = 1 - dist / GUARD.viewRange;
  let clarity = 0.35 + closeness * 0.65;
  if (player.sneaking) clarity *= 0.55;
  if (player.inShadow) clarity *= 0.5;
  if (player.hidden) clarity *= 0.4;
  return Math.min(1, clarity);
}

export function stepGuard(guard, player, dt, events) {
  const seen = seePlayer(guard, player);
  if (seen > 0) {
    const rate = GUARD.suspicionRate * seen * (player.moving && !player.sneaking ? 1.4 : 1);
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeenX = player.x;
    guard.lastSeenY = player.y;
    guard.loseTimer = 0;
    if (guard.suspicion >= 1 && guard.state !== STATE_CHASE) {
      guard.state = STATE_CHASE;
      events.push({ type: 'alert', x: guard.x, y: guard.y });
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
  }

  if (guard.state === STATE_PATROL) {
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
      return;
    }
    const wp = guard.path[guard.waypoint];
    const tx = (wp[0] + 0.5) * TILE;
    const ty = (wp[1] + 0.5) * TILE;
    if (moveToward(guard, tx, ty, GUARD.patrolSpeed, dt)) {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
      guard.pauseLeft = guard.pause;
    }
  } else if (guard.state === STATE_CHASE) {
    if (seen > 0) {
      guard.loseTimer = 0;
      moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt);
    } else {
      guard.loseTimer += dt;
      moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed, dt);
      if (guard.loseTimer > GUARD.memorySeconds) {
        guard.state = STATE_SEARCH;
        guard.searchTimer = 3.5;
      }
    }
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    if (dist < GUARD.catchRange) events.push({ type: 'caught', x: guard.x, y: guard.y });
  } else if (guard.state === STATE_SEARCH) {
    guard.searchTimer -= dt;
    if (seen > 0) {
      guard.state = STATE_CHASE;
      guard.loseTimer = 0;
    } else if (guard.searchTimer <= 0) {
      guard.state = STATE_RETURN;
    } else {
      const reached = moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.searchSpeed, dt);
      if (reached) guard.dir += dt * 1.6;
    }
  } else if (guard.state === STATE_RETURN) {
    const wp = guard.path[guard.waypoint];
    const tx = (wp[0] + 0.5) * TILE;
    const ty = (wp[1] + 0.5) * TILE;
    if (moveToward(guard, tx, ty, GUARD.patrolSpeed, dt)) guard.state = STATE_PATROL;
  }
}

// A noise at (x, y) pulls a patrolling guard over to look.
export function hearNoise(guard, x, y, radius) {
  if (guard.state === STATE_CHASE) return;
  const dist = Math.hypot(x - guard.x, y - guard.y);
  if (dist > radius + GUARD.hearRange * 0.4) return;
  guard.lastSeenX = x;
  guard.lastSeenY = y;
  guard.suspicion = Math.min(1, guard.suspicion + 0.35);
  if (guard.state === STATE_PATROL || guard.state === STATE_RETURN) {
    guard.state = STATE_SEARCH;
    guard.searchTimer = 3;
  }
}
