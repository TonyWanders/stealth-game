// Nightshift: The Meridian Vault - the screenshot scenes behind ?shot=.
// Each scene stages a real world state by hand (no randomness, no play
// needed), so the same URL always renders the same frame: the title screen,
// a guard patrol sweeping past the player in cover, a near-miss alert with
// the detection meter high, and the exit run with all intel grabbed.
import { TILE } from './config.js';
import { makeWorld } from './world.js';
import { STATE_CHASE, STATE_PATROL } from './guard.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_CLEAR } from './render.js';

function placeAt(entity, tx, ty) {
  entity.x = (tx + 0.5) * TILE;
  entity.y = (ty + 0.5) * TILE;
}

function face(entity, tx, ty) {
  entity.dir = Math.atan2((ty + 0.5) * TILE - entity.y, (tx + 0.5) * TILE - entity.x);
}

// Stage the named scene and return the world plus the screen to draw.
export function stageShot(name) {
  const world = makeWorld(0);
  const [g0, g1, g2] = world.guards;
  if (name === 'patrol') {
    placeAt(world.player, 13, 7);
    world.player.dirX = 1;
    world.player.dirY = 0;
    placeAt(g0, 8, 7);
    face(g0, 20, 7);
    g0.state = STATE_PATROL;
    g0.suspicion = 0.25;
    placeAt(g1, 20, 8);
    face(g1, 8, 8);
    g1.state = STATE_PATROL;
    g1.suspicion = 0;
    placeAt(g2, 14, 16);
    face(g2, 24, 16);
    g2.state = STATE_PATROL;
    world.time = 42;
    return { world, screen: SCREEN_PLAY, message: '' };
  }
  if (name === 'alert') {
    placeAt(world.player, 24, 17);
    world.player.dirX = -1;
    world.player.dirY = 0;
    world.player.sneaking = true;
    placeAt(g0, 20, 16);
    face(g0, 24, 17);
    g0.state = STATE_CHASE;
    g0.suspicion = 1;
    g0.lastSeenX = world.player.x;
    g0.lastSeenY = world.player.y;
    placeAt(g1, 10, 8);
    face(g1, 14, 8);
    g1.suspicion = 0.6;
    placeAt(g2, 24, 7);
    face(g2, 24, 16);
    g2.suspicion = 0.35;
    world.parsed.intel[0].taken = true;
    world.intelLeft = 2;
    world.score = 150;
    world.alerts = 1;
    world.time = 96;
    return { world, screen: SCREEN_PLAY, message: 'SPOTTED - GET TO COVER' };
  }
  if (name === 'exit') {
    for (const spot of world.parsed.intel) spot.taken = true;
    world.intelLeft = 0;
    world.exitOpen = true;
    world.score = 850;
    world.time = 148;
    placeAt(world.player, 5, 18);
    world.player.dirX = 0;
    world.player.dirY = -1;
    placeAt(g0, 10, 7);
    face(g0, 20, 7);
    g0.suspicion = 0;
    placeAt(g1, 22, 8);
    face(g1, 12, 8);
    g1.suspicion = 0.1;
    placeAt(g2, 18, 16);
    face(g2, 8, 16);
    g2.suspicion = 0;
    return { world, screen: SCREEN_PLAY, message: 'EXIT IS OPEN - GET OUT UNSEEN' };
  }
  // start: the title screen over a fresh level, guards mid-patrol.
  placeAt(g0, 12, 7);
  face(g0, 24, 7);
  placeAt(g1, 18, 8);
  face(g1, 4, 8);
  placeAt(g2, 12, 16);
  face(g2, 22, 16);
  world.time = 5;
  return { world, screen: SCREEN_TITLE, message: '' };
}
