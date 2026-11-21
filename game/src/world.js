// Nightshift: The Meridian Vault - the world: one level at a time.
// Holds the parsed level, the player, the guards, the intel and the exit,
// steps them all forward, and reports what happened (pickup, alert, caught,
// level clear) so the game shell can score it and play sounds.
import { TILE, GAME } from './config.js';
import { LEVELS, parseLevel } from './level.js';
import { makePlayer, stepPlayer, playerNoise } from './player.js';
import { makeGuard, stepGuard, hearNoise, STATE_CHASE } from './guard.js';

export function makeWorld(levelIndex) {
  const def = LEVELS[levelIndex];
  const parsed = parseLevel(def);
  const player = makePlayer(parsed);
  const guards = def.guards.map((g) => makeGuard(g, parsed));
  const world = {
    levelIndex,
    def,
    parsed,
    player,
    guards,
    intelLeft: GAME.intelPerLevel,
    time: 0,
    alerts: 0,
    score: 0,
    coins: [],
    events: [],
    finished: false,
    failed: false,
    exitOpen: false,
  };
  return world;
}

// Step the whole world one tick. Returns the events that happened.
export function stepWorld(world, input, dt, audio) {
  const events = [];
  if (world.finished || world.failed) return events;
  world.time += dt;
  const player = world.player;

  stepPlayer(player, world.parsed, input, dt);

  const noise = playerNoise(player);
  if (noise > 0) {
    const now = world.time;
    if (!world.lastStepAt || now - world.lastStepAt > 0.42) {
      world.lastStepAt = now;
      if (audio) audio.step(player.sneaking);
      for (const guard of world.guards) hearNoise(guard, player.x, player.y, noise);
    }
  }

  if (input.throwCoin && player.distracts > 0) {
    player.distracts -= 1;
    const coin = { x: input.throwX, y: input.throwY, ttl: 0.4, landed: false };
    world.coins.push(coin);
    if (audio) audio.coin();
    events.push({ type: 'throw' });
  }
  for (const coin of world.coins) {
    if (!coin.landed) {
      coin.ttl -= dt;
      if (coin.ttl <= 0) {
        coin.landed = true;
        coin.ring = 0;
        if (audio) audio.coinLand();
        for (const guard of world.guards) hearNoise(guard, coin.x, coin.y, GAME.distractRadius);
      }
    } else if (coin.ring !== undefined && coin.ring < 1) {
      coin.ring += dt * 1.4;
    }
  }
  world.coins = world.coins.filter((c) => c.ring === undefined || c.ring < 1);

  for (const guard of world.guards) {
    const before = guard.state;
    stepGuard(guard, player, dt, events);
    if (guard.state === STATE_CHASE && before !== STATE_CHASE) {
      world.alerts += 1;
      if (audio) audio.alert();
    }
  }

  for (const spot of world.parsed.intel) {
    if (spot.taken) continue;
    const cx = (spot.x + 0.5) * TILE;
    const cy = (spot.y + 0.5) * TILE;
    if (Math.hypot(player.x - cx, player.y - cy) < 26) {
      spot.taken = true;
      world.intelLeft -= 1;
      world.score += 150;
      if (audio) audio.pickup();
      events.push({ type: 'intel', left: world.intelLeft });
      if (world.intelLeft === 0) {
        world.exitOpen = true;
        events.push({ type: 'exitOpen' });
      }
    }
  }

  for (const e of events) {
    if (e.type === 'caught') {
      world.failed = true;
      if (audio) audio.caught();
    }
  }

  if (!world.failed && world.exitOpen) {
    const ex = world.parsed.exit;
    const cx = (ex.x + 0.5) * TILE;
    const cy = (ex.y + 0.5) * TILE;
    if (Math.hypot(player.x - cx, player.y - cy) < 26) {
      world.finished = true;
      const timeBonus = Math.max(0, 600 - Math.floor(world.time * 4));
      const alertPenalty = world.alerts * 50;
      world.score += 400 + timeBonus - alertPenalty;
      if (audio) audio.clear();
      events.push({ type: 'clear', score: world.score, time: world.time });
    }
  }

  return events;
}

// Highest suspicion across the guards, for the HUD meter.
export function maxSuspicion(world) {
  let top = 0;
  for (const guard of world.guards) top = Math.max(top, guard.suspicion);
  return top;
}

// Any guard currently chasing the player.
export function anyChase(world) {
  return world.guards.some((g) => g.state === STATE_CHASE);
}
