// Nightshift: The Meridian Vault - the player: movement, stance and noise.
// The player walks with WASD or arrows, holds Shift to sneak (slower, much
// quieter, harder to spot), and throws a coin with Q or a mouse click to
// pull a guard away. Bushes hide the player; shadows slow detection.
import { TILE, PLAYER, GAME } from './config.js';
import { isSolidTile, isBushTile, isShadowTile } from './level.js';

export function makePlayer(parsed) {
  const start = parsed.start;
  return {
    x: (start.x + 0.5) * TILE,
    y: (start.y + 0.5) * TILE,
    dirX: 1,
    dirY: 0,
    moving: false,
    sneaking: false,
    hidden: false,
    inShadow: false,
    distracts: GAME.distractCount,
    stepPhase: 0,
  };
}

// Circle against the solid tiles: move one axis, push out, then the other.
function moveAxis(player, parsed, dx, dy) {
  const r = PLAYER.radius;
  player.x += dx;
  player.y += dy;
  const minX = Math.floor((player.x - r) / TILE);
  const maxX = Math.floor((player.x + r) / TILE);
  const minY = Math.floor((player.y - r) / TILE);
  const maxY = Math.floor((player.y + r) / TILE);
  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      if (!isSolidTile(parsed, tx, ty)) continue;
      const left = tx * TILE;
      const right = left + TILE;
      const top = ty * TILE;
      const bottom = top + TILE;
      const overlapX = Math.min(player.x + r, right) - Math.max(player.x - r, left);
      const overlapY = Math.min(player.y + r, bottom) - Math.max(player.y - r, top);
      if (overlapX <= 0 || overlapY <= 0) continue;
      if (dx !== 0) player.x += dx > 0 ? -overlapX : overlapX;
      else if (dy !== 0) player.y += dy > 0 ? -overlapY : overlapY;
    }
  }
}

export function stepPlayer(player, parsed, input, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.moving = mx !== 0 || my !== 0;
  player.sneaking = Boolean(input.sneak) && player.moving;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (player.moving) {
    const len = Math.hypot(mx, my);
    const nx = mx / len;
    const ny = my / len;
    player.dirX = nx;
    player.dirY = ny;
    moveAxis(player, parsed, nx * speed * dt, 0);
    moveAxis(player, parsed, 0, ny * speed * dt);
    player.stepPhase += (speed * dt) / 14;
  }
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  player.hidden = isBushTile(parsed, tx, ty);
  player.inShadow = isShadowTile(parsed, tx, ty);
  return player;
}

// How far the player's footsteps carry right now (0 when still).
export function playerNoise(player) {
  if (!player.moving) return 0;
  return player.sneaking ? PLAYER.noiseSneak : PLAYER.noiseWalk;
}
