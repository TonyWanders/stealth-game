// Nightshift: The Meridian Vault - everything the player sees.
// Top-down canvas art: a dark night floor, walls, crates and bushes for
// cover, guards with bright vision cones, a glowing exit, and a HUD that
// reads at a glance. Title, caught, level-clear and win screens are drawn
// here too, so the screenshots show the whole game.
import { TILE, VIEW_W, VIEW_H, GUARD, COLORS } from './config.js';
import { STATE_CHASE } from './guard.js';
import { maxSuspicion, anyChase } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function tileCentre(t) {
  return (t + 0.5) * TILE;
}

function drawFloor(ctx, world) {
  for (let y = 0; y < 20; y += 1) {
    for (let x = 0; x < 30; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  ctx.strokeStyle = COLORS.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= 30; x += 1) {
    ctx.moveTo(x * TILE + 0.5, 0);
    ctx.lineTo(x * TILE + 0.5, VIEW_H);
  }
  for (let y = 0; y <= 20; y += 1) {
    ctx.moveTo(0, y * TILE + 0.5);
    ctx.lineTo(VIEW_W, y * TILE + 0.5);
  }
  ctx.stroke();
  for (const r of world.def.shadows) {
    ctx.fillStyle = 'rgba(8, 10, 18, 0.5)';
    ctx.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(120, 140, 180, 0.35)';
    ctx.strokeRect(r.x * TILE + 1, r.y * TILE + 1, r.w * TILE - 2, r.h * TILE - 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(150, 170, 210, 0.55)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW', r.x * TILE + 6, r.y * TILE + 14);
  }
}

function drawExit(ctx, world, t) {
  const ex = world.parsed.exit;
  const cx = tileCentre(ex.x);
  const cy = tileCentre(ex.y);
  const pulse = 0.5 + Math.sin(t * 3) * 0.5;
  ctx.save();
  if (world.exitOpen) {
    ctx.shadowColor = COLORS.exit;
    ctx.shadowBlur = 18 + pulse * 14;
    ctx.fillStyle = COLORS.exit;
  } else {
    ctx.fillStyle = '#274d38';
  }
  ctx.fillRect(cx - 14, cy - 14, 28, 28);
  ctx.restore();
  ctx.strokeStyle = world.exitOpen ? '#b8ffce' : '#5a7a68';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 14, cy - 14, 28, 28);
  ctx.fillStyle = world.exitOpen ? '#062b16' : '#9fc4ae';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', cx, cy - 20);
  if (world.exitOpen) {
    ctx.fillStyle = `rgba(47, 214, 122, ${0.5 + pulse * 0.5})`;
    ctx.font = 'bold 16px monospace';
    ctx.fillText('▼', cx, cy + 34);
  } else {
    ctx.fillStyle = '#c9a13b';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('LOCKED', cx, cy + 30);
  }
}

function drawIntel(ctx, world, t) {
  for (const spot of world.parsed.intel) {
    if (spot.taken) continue;
    const cx = tileCentre(spot.x);
    const cy = tileCentre(spot.y);
    const bob = Math.sin(t * 2.4 + spot.x) * 2;
    ctx.save();
    ctx.shadowColor = COLORS.intel;
    ctx.shadowBlur = 12 + Math.sin(t * 3) * 5;
    ctx.fillStyle = COLORS.intel;
    ctx.fillRect(cx - 8, cy - 10 + bob, 16, 20);
    ctx.restore();
    ctx.fillStyle = '#7a5b00';
    ctx.fillRect(cx - 8, cy - 10 + bob, 16, 4);
    ctx.fillStyle = '#3d2f00';
    ctx.fillRect(cx - 5, cy - 2 + bob, 10, 2);
    ctx.fillRect(cx - 5, cy + 2 + bob, 10, 2);
    ctx.fillStyle = COLORS.intel;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INTEL', cx, cy - 16 + bob);
  }
}

function drawCrates(ctx, world) {
  for (const c of world.parsed.crates) {
    const x = c.x * TILE;
    const y = c.y * TILE;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = COLORS.crateTop;
    ctx.fillRect(x + 1, y + 1, TILE - 2, 6);
    ctx.strokeStyle = '#3d2c17';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + TILE - 2, y + TILE - 2);
    ctx.moveTo(x + TILE - 2, y + 2);
    ctx.lineTo(x + 2, y + TILE - 2);
    ctx.stroke();
  }
}

function drawWalls(ctx, world) {
  for (const w of world.parsed.walls) {
    const x = w.x * TILE;
    const y = w.y * TILE;
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x, y, TILE, 5);
    ctx.strokeStyle = '#141821';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }
}

function drawBushBase(ctx, world) {
  for (const b of world.parsed.bushes) {
    const cx = tileCentre(b.x);
    const cy = tileCentre(b.y);
    ctx.fillStyle = COLORS.bush;
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.bushLeaf;
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 4, 7, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 5, 6, 0, Math.PI * 2);
    ctx.arc(cx + 2, cy + 6, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBushTop(ctx, world) {
  ctx.save();
  ctx.globalAlpha = 0.75;
  drawBushBase(ctx, world);
  ctx.restore();
}

function drawCone(ctx, guard, t) {
  const alert = guard.state === STATE_CHASE;
  const range = GUARD.viewRange;
  const half = GUARD.viewHalfAngle;
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, range);
  if (alert) {
    grad.addColorStop(0, 'rgba(255, 70, 50, 0.42)');
    grad.addColorStop(1, 'rgba(255, 70, 50, 0.05)');
  } else if (guard.suspicion > 0.05) {
    grad.addColorStop(0, 'rgba(255, 170, 60, 0.34)');
    grad.addColorStop(1, 'rgba(255, 170, 60, 0.04)');
  } else {
    grad.addColorStop(0, COLORS.coneCalm);
    grad.addColorStop(1, 'rgba(255, 214, 90, 0.03)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, guard.dir - half, guard.dir + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = alert ? 'rgba(255, 70, 50, 0.5)' : COLORS.coneEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawGuard(ctx, guard, t) {
  drawCone(ctx, guard, t);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a1408';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = guard.x + Math.cos(guard.dir) * 9;
  const fy = guard.y + Math.sin(guard.dir) * 9;
  ctx.strokeStyle = '#ffd9d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  if (guard.suspicion > 0.03) {
    const s = guard.suspicion;
    ctx.strokeStyle = s > 0.7 ? '#ff4632' : '#ffb02e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 18, -Math.PI / 2, -Math.PI / 2 + s * Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  if (guard.state === STATE_CHASE) {
    ctx.fillStyle = '#ff4632';
    ctx.fillText('!', guard.x, guard.y - 20);
  } else if (guard.suspicion > 0.45) {
    ctx.fillStyle = '#ffb02e';
    ctx.fillText('?', guard.x, guard.y - 20);
  }
}

function drawPlayer(ctx, player, t) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 9, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(55, 214, 224, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b4d54';
  ctx.lineWidth = 2;
  ctx.stroke();
  const fx = player.x + player.dirX * 9;
  const fy = player.y + player.dirY * 9;
  ctx.strokeStyle = '#e8feff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(fx, fy);
  ctx.stroke();
}

function drawCoins(ctx, world) {
  for (const coin of world.coins) {
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5b00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (coin.ring !== undefined) {
      ctx.strokeStyle = `rgba(255, 211, 77, ${1 - coin.ring})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 8 + coin.ring * 46, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawDarkness(ctx, world) {
  const p = world.player;
  const grad = ctx.createRadialGradient(p.x, p.y, 60, p.x, p.y, 340);
  grad.addColorStop(0, 'rgba(4, 6, 12, 0)');
  grad.addColorStop(1, 'rgba(4, 6, 12, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHud(ctx, world, ui) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(world.def.name.toUpperCase(), 10, 22);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#ffd34d';
  const intelText = `INTEL ${GAME_INTEL_TAKEN(world)}/${world.parsed.intel.length}`;
  ctx.fillText(intelText, 300, 22);
  ctx.fillStyle = '#e8ecf4';
  ctx.fillText(`TIME ${formatTime(world.time)}`, 420, 22);
  ctx.fillStyle = world.alerts > 0 ? '#ff7a6a' : '#e8ecf4';
  ctx.fillText(`ALARMS ${world.alerts}/3`, 540, 22);
  ctx.fillStyle = '#e8ecf4';
  ctx.fillText(`COINS ${world.player.distracts}`, 660, 22);
  ctx.fillText(`SCORE ${world.score}`, 760, 22);
  const s = maxSuspicion(world);
  ctx.fillStyle = '#2b313e';
  ctx.fillRect(10, VIEW_H - 26, 220, 12);
  ctx.fillStyle = s > 0.7 ? '#ff4632' : s > 0.3 ? '#ffb02e' : '#2fd67a';
  ctx.fillRect(10, VIEW_H - 26, 220 * s, 12);
  ctx.strokeStyle = '#565f73';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, VIEW_H - 26.5, 220, 12);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(anyChase(world) ? 'SPOTTED - RUN' : s > 0.3 ? 'THEY SAW SOMETHING' : 'UNSEEN', 240, VIEW_H - 15);
  ctx.fillStyle = '#9aa4b8';
  ctx.font = '11px monospace';
  const objective = world.exitOpen
    ? 'EXIT IS OPEN - GET OUT UNSEEN'
    : `GRAB ${world.intelLeft} MORE INTEL, THEN REACH THE EXIT`;
  ctx.textAlign = 'right';
  ctx.fillText(objective, VIEW_W - 10, VIEW_H - 15);
  if (ui.message) {
    ctx.fillStyle = '#ffd34d';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ui.message, VIEW_W / 2, 58);
  }
}

function GAME_INTEL_TAKEN(world) {
  return world.parsed.intel.filter((i) => i.taken).length;
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(4, 6, 12, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(10, 14, 24, 0.95)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  const w = 620;
  const h = 330;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, y + 62);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '15px monospace';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 108 + i * 26));
}

export function render(ctx, world, screen, ui, t) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (!world) return;
  drawFloor(ctx, world);
  drawExit(ctx, world, t);
  drawIntel(ctx, world, t);
  drawCrates(ctx, world);
  drawWalls(ctx, world);
  drawBushBase(ctx, world);
  drawCoins(ctx, world);
  for (const guard of world.guards) drawGuard(ctx, guard, t);
  drawPlayer(ctx, world.player, t);
  drawBushTop(ctx, world);
  drawDarkness(ctx, world);
  drawHud(ctx, world, ui);

  if (screen === SCREEN_TITLE) {
    drawPanel(ctx, 'NIGHTSHIFT', [
      'The Meridian Vault - a stealth job in three levels.',
      'Slip past the guards. Grab 3 intel. Reach the exit unseen.',
      '',
      'Move: WASD or arrows    Sneak: hold Shift (slow, quiet, hard to see)',
      'Throw a coin: Q or click    Mute: M    Restart level: R',
      'Hide in bushes. Shadows slow the guards\' eyes. Coins pull them away.',
      '',
      'Press ENTER to begin',
    ], '#37d6e0');
  } else if (screen === SCREEN_CLEAR) {
    drawPanel(ctx, 'LEVEL CLEAR', [
      `${world.def.name} done. Score ${world.score}.`,
      `Time ${formatTime(world.time)} - Alarms raised ${world.alerts}.`,
      '',
      'Press ENTER for the next level',
    ], '#2fd67a');
  } else if (screen === SCREEN_CAUGHT) {
    drawPanel(ctx, 'CAUGHT', [
      'A guard grabbed you in the open.',
      `Alarms raised: ${world.alerts} of 3. The level restarts.`,
      '',
      'Sneak more, watch the cones, use the bushes.',
      'Press R to try the level again',
    ], '#ff5a4e');
  } else if (screen === SCREEN_OVER) {
    drawPanel(ctx, 'BLOWN COVER', [
      'Three alarms. The vault is locked down and the job is off.',
      `Final score ${ui.totalScore}.`,
      '',
      'Press ENTER to start over',
    ], '#ff5a4e');
  } else if (screen === SCREEN_WIN) {
    drawPanel(ctx, 'GHOST RUN COMPLETE', [
      'All three levels cleared. Nobody saw a thing.',
      `Final score ${ui.totalScore}.`,
      '',
      'Press ENTER to play again',
    ], '#2fd67a');
  }
}
