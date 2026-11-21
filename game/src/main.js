// Nightshift: The Meridian Vault - the game shell.
// Owns the canvas, the loop, the screens and the level flow. A ?shot=
// query stages a fixed screenshot scene instead of starting the game;
// otherwise the game starts on the title screen and Enter begins level 1.
import { VIEW_W, VIEW_H, STEP } from './config.js';
import { makeAudio } from './audio.js';
import { makeInput } from './input.js';
import { makeWorld, stepWorld } from './world.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_CAUGHT, SCREEN_OVER, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = makeAudio();
const input = makeInput(canvas);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);

let world = null;
let screen = SCREEN_TITLE;
let totalScore = 0;
let totalAlerts = 0;
let muted = false;
let message = '';
let messageUntil = 0;
let paused = false;
let last = performance.now();
let acc = 0;
let mutePressed = false;
let pausePressed = false;

function showMessage(text, seconds) {
  message = text;
  messageUntil = performance.now() + seconds * 1000;
}

function startLevel(index) {
  world = makeWorld(index);
  screen = SCREEN_PLAY;
  paused = false;
}

function startGame() {
  totalScore = 0;
  totalAlerts = 0;
  startLevel(0);
  showMessage('GRAB 3 INTEL, THEN REACH THE EXIT', 4);
}

if (shotName) {
  const staged = stageShot(shotName);
  world = staged.world;
  screen = staged.screen;
  totalScore = staged.world.score;
  if (staged.message) showMessage(staged.message, 60);
  render(ctx, world, screen, { message, totalScore, muted }, seed * 1.7 + 4);
} else {
  world = makeWorld(0);
  requestAnimationFrame(frame);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (message && now > messageUntil) message = '';
  const state = input.read();

  if (state.mute && !mutePressed) {
    muted = audio.toggleMute();
    showMessage(muted ? 'SOUND OFF' : 'SOUND ON', 1.5);
  }
  mutePressed = state.mute;
  if (state.pause && !pausePressed && screen === SCREEN_PLAY) paused = !paused;
  pausePressed = state.pause;
  if (state.enter) audio.unlock();

  if (screen === SCREEN_TITLE && state.enter) {
    audio.click();
    startGame();
    input.consume('enter');
  } else if (screen === SCREEN_CLEAR && state.enter) {
    audio.click();
    totalScore += world.score;
    if (world.levelIndex + 1 >= 3) {
      screen = SCREEN_WIN;
    } else {
      startLevel(world.levelIndex + 1);
      showMessage(`LEVEL ${world.levelIndex + 1}: ${world.def.name.toUpperCase()}`, 3);
    }
    input.consume('enter');
  } else if (screen === SCREEN_CAUGHT && state.restart) {
    audio.click();
    startLevel(world.levelIndex);
    input.consume('r');
  } else if ((screen === SCREEN_OVER || screen === SCREEN_WIN) && state.enter) {
    audio.click();
    startGame();
    input.consume('enter');
  }

  if (screen === SCREEN_PLAY && !paused) {
    acc += dt;
    while (acc >= STEP) {
      const events = stepWorld(world, state, STEP, audio);
      for (const e of events) {
        if (e.type === 'intel') showMessage(e.left === 0 ? 'ALL INTEL GRABBED - EXIT IS OPEN' : `INTEL GRABBED - ${e.left} LEFT`, 2.5);
        if (e.type === 'exitOpen') showMessage('EXIT IS OPEN - GET OUT UNSEEN', 3);
        if (e.type === 'alert') showMessage('SPOTTED', 2);
      }
      if (world.failed) {
        totalAlerts = world.alerts;
        screen = world.alerts >= 3 ? SCREEN_OVER : SCREEN_CAUGHT;
      } else if (world.finished) {
        screen = SCREEN_CLEAR;
      }
      acc -= STEP;
    }
  }

  const t = now / 1000;
  render(ctx, world, screen, { message, totalScore: totalScore + (world ? world.score : 0), muted }, t);
  if (paused && screen === SCREEN_PLAY) {
    ctx.fillStyle = 'rgba(4, 6, 12, 0.7)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#e8ecf4';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED - press P to continue', VIEW_W / 2, VIEW_H / 2);
  }
}
