import { HeistAudio } from './audio.js';
import { FIXED_DT } from './constants.js';
import { applyShotPreset, createHeistState, executeGadgetOrAction, stepSimulation } from './engine.js';
import { createHudBinder } from './hud.js';
import { computeViewportTransform, renderWorld } from './renderer.js';

const canvas = document.getElementById('heist-canvas');
const ctx = canvas.getContext('2d');
const audio = new HeistAudio();

const syncHud = createHudBinder({
  wingName: document.getElementById('wing-name'),
  wingBtns: [...document.querySelectorAll('.wing-btn')],
  objectiveText: document.getElementById('objective-text'),
  coverPill: document.getElementById('cover-pill'),
  alarmModule: document.getElementById('alarm-module'),
  alarmValue: document.getElementById('alarm-value'),
  alarmSegments: document.getElementById('alarm-segments'),
  haulValue: document.getElementById('haul-value'),
  muteBtn: document.getElementById('mute-btn'),
  empPips: document.getElementById('emp-pips'),
  decoyPips: document.getElementById('decoy-pips'),
  smokePips: document.getElementById('smoke-pips'),
  btnEmp: document.getElementById('btn-emp'),
  btnDecoy: document.getElementById('btn-decoy'),
  btnSmoke: document.getElementById('btn-smoke'),
  btnInteract: document.getElementById('btn-interact'),
  interactLabel: document.getElementById('interact-label'),
  interactSub: document.getElementById('interact-sub'),
  debriefCard: document.getElementById('debrief-card'),
  debriefKicker: document.getElementById('debrief-kicker'),
  debriefHeading: document.getElementById('debrief-heading'),
  debriefReason: document.getElementById('debrief-reason'),
  debriefStats: document.getElementById('debrief-stats'),
  btnDebriefPrimary: document.getElementById('btn-debrief-primary'),
  btnDebriefNext: document.getElementById('btn-debrief-next'),
  ariaStatus: document.getElementById('aria-status'),
});

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || 1);
const initialWing = Number(params.get('wing') || 0);

let state = shotName ? applyShotPreset(shotName, seedParam) : createHeistState(initialWing, seedParam);
let pointerWorld = null;
let lastTf = { scale: 1, ox: 0, oy: 0 };

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  sprint: false,
};

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawFrame() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  lastTf = renderWorld(ctx, w, h, state, pointerWorld);
  syncHud(state, audio.muted);
}

function resetWing(wingIdx = state.wingIndex) {
  state = createHeistState(wingIdx, seedParam);
  drawFrame();
}

window.addEventListener('resize', () => {
  resizeCanvas();
  drawFrame();
});

window.addEventListener('keydown', (e) => {
  audio.unlock();
  const k = e.code;
  if (k === 'KeyW' || k === 'ArrowUp') input.up = true;
  else if (k === 'KeyS' || k === 'ArrowDown') input.down = true;
  else if (k === 'KeyA' || k === 'ArrowLeft') input.left = true;
  else if (k === 'KeyD' || k === 'ArrowRight') input.right = true;
  else if (k === 'ShiftLeft' || k === 'ShiftRight') input.sprint = true;
  else if (k === 'Digit1') executeGadgetOrAction(state, 'emp', pointerWorld, audio);
  else if (k === 'Digit2') executeGadgetOrAction(state, 'decoy', pointerWorld, audio);
  else if (k === 'Digit3') executeGadgetOrAction(state, 'smoke', pointerWorld, audio);
  else if (k === 'KeyE') executeGadgetOrAction(state, 'interact', pointerWorld, audio);
  else if (k === 'KeyR') resetWing(state.wingIndex);
  else if (k === 'KeyM') {
    audio.toggleMute();
    syncHud(state, audio.muted);
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.code;
  if (k === 'KeyW' || k === 'ArrowUp') input.up = false;
  else if (k === 'KeyS' || k === 'ArrowDown') input.down = false;
  else if (k === 'KeyA' || k === 'ArrowLeft') input.left = false;
  else if (k === 'KeyD' || k === 'ArrowRight') input.right = false;
  else if (k === 'ShiftLeft' || k === 'ShiftRight') input.sprint = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const tf = computeViewportTransform(rect.width, rect.height);
  pointerWorld = {
    x: (e.clientX - rect.left - tf.ox) / tf.scale,
    y: (e.clientY - rect.top - tf.oy) / tf.scale,
  };
});

canvas.addEventListener('mousedown', (e) => {
  audio.unlock();
  const rect = canvas.getBoundingClientRect();
  const tf = computeViewportTransform(rect.width, rect.height);
  const wx = (e.clientX - rect.left - tf.ox) / tf.scale;
  const wy = (e.clientY - rect.top - tf.oy) / tf.scale;
  pointerWorld = { x: wx, y: wy };
  executeGadgetOrAction(state, 'decoy', pointerWorld, audio);
  drawFrame();
});

for (const btn of document.querySelectorAll('.wing-btn')) {
  btn.addEventListener('click', () => {
    audio.unlock();
    resetWing(Number(btn.dataset.wing));
  });
}

document.getElementById('mute-btn').addEventListener('click', () => {
  audio.toggleMute();
  syncHud(state, audio.muted);
});

document.getElementById('btn-emp').addEventListener('click', () => {
  audio.unlock();
  executeGadgetOrAction(state, 'emp', pointerWorld, audio);
  drawFrame();
});

document.getElementById('btn-decoy').addEventListener('click', () => {
  audio.unlock();
  state.armedTool = state.armedTool === 'decoy' ? null : 'decoy';
  drawFrame();
});

document.getElementById('btn-smoke').addEventListener('click', () => {
  audio.unlock();
  executeGadgetOrAction(state, 'smoke', pointerWorld, audio);
  drawFrame();
});

document.getElementById('btn-interact').addEventListener('click', () => {
  audio.unlock();
  executeGadgetOrAction(state, 'interact', pointerWorld, audio);
  drawFrame();
});

document.getElementById('btn-retry-inline').addEventListener('click', () => resetWing(state.wingIndex));
document.getElementById('btn-debrief-primary').addEventListener('click', () => resetWing(state.wingIndex));
document.getElementById('btn-debrief-next').addEventListener('click', () => {
  resetWing((state.wingIndex + 1) % 3);
});

window.__HEIST_GAME__ = {
  getState: () => state,
  loadWing: (idx) => resetWing(idx),
  stepTicks: (ticks = 1) => {
    for (let i = 0; i < ticks; i++) stepSimulation(state, input, FIXED_DT, audio);
    drawFrame();
  },
  teleport: (x, y) => {
    state.player.x = x;
    state.player.y = y;
    drawFrame();
  },
  applyShot: (name) => {
    state = applyShotPreset(name, seedParam);
    drawFrame();
  },
  getTransform: () => lastTf,
};

resizeCanvas();
drawFrame();

if (!shotName) {
  let prev = performance.now();
  let acc = 0;
  function tick(now) {
    const frameDt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    acc += frameDt;
    while (acc >= FIXED_DT) {
      stepSimulation(state, input, FIXED_DT, audio);
      acc -= FIXED_DT;
    }
    drawFrame();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
