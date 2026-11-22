import {
  EXTRACTION_RADIUS,
  PLAYER_RADIUS,
  PLAYER_SPRINT_SPEED,
  PLAYER_WALK_SPEED,
  SPRINT_NOISE_RADIUS,
  WORLD_H,
  WORLD_W,
} from './constants.js';
import { WINGS } from './levels.js';
import { deploySmokeVeil, findNearestInteractable, performInteract, throwBrassDecoy, triggerEmpPulse } from './gadgets.js';
import { computePlayerCover, updateStealthAI } from './stealth-ai.js';
import { buildOpaqueSegments, computeVisionPolygon } from './vision.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveCircleWalls(x, y, radius, walls) {
  let px = Math.max(radius + 24, Math.min(WORLD_W - radius - 24, x));
  let py = Math.max(radius + 36, Math.min(WORLD_H - radius - 22, y));
  for (let pass = 0; pass < 2; pass++) {
    for (const w of walls) {
      const closestX = Math.max(w.x, Math.min(px, w.x + w.w));
      const closestY = Math.max(w.y, Math.min(py, w.y + w.h));
      const dx = px - closestX;
      const dy = py - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 1e-5) {
          const push = radius - dist;
          px += (dx / dist) * push;
          py += (dy / dist) * push;
        } else {
          const left = px - w.x;
          const right = w.x + w.w - px;
          const top = py - w.y;
          const bottom = w.y + w.h - py;
          const m = Math.min(left, right, top, bottom);
          if (m === left) px = w.x - radius;
          else if (m === right) px = w.x + w.w + radius;
          else if (m === top) py = w.y - radius;
          else py = w.y + w.h + radius;
        }
      }
    }
  }
  return { x: px, y: py };
}

export function createHeistState(wingIndex = 0, seed = 1) {
  const tpl = WINGS[Math.max(0, Math.min(WINGS.length - 1, wingIndex))];
  const walls = tpl.walls.map((w) => ({ ...w }));
  const segments = buildOpaqueSegments(walls);
  const guards = tpl.guards.map((g, idx) => {
    const start = g.route[0];
    const next = g.route[1] || start;
    return {
      id: g.id,
      name: g.name,
      fov: g.fov,
      range: g.range,
      route: g.route.map((pt) => ({ ...pt })),
      x: start.x,
      y: start.y,
      angle: Math.atan2(next.y - start.y, next.x - start.x),
      wpIndex: 1 % g.route.length,
      pauseTimer: idx * 0.2,
      state: 'patrol',
      suspicion: 0,
      investigateTarget: null,
      investigateTimer: 0,
      lastKnown: null,
      polygon: [],
    };
  });
  const cameras = tpl.cameras.map((c) => ({
    ...c,
    angle: c.baseAngle + Math.sin(c.phase) * c.sweepSpan * 0.5,
    polygon: [],
  }));

  const state = {
    wingIndex: tpl.id,
    wingCode: tpl.code,
    wingName: tpl.name,
    wingSubtitle: tpl.subtitle,
    seed,
    rng: mulberry32(seed),
    phase: 'playing',
    elapsed: 0,
    alarm: 0,
    haul: 0,
    primaryLootStolen: false,
    extracted: false,
    toolsUsedCount: 0,
    armedTool: null,
    statusNote: 'Slip past guards & cameras to lift the primary artifact.',
    caughtInfo: null,
    player: {
      x: tpl.spawn.x,
      y: tpl.spawn.y,
      angle: 0,
      sprinting: false,
      inCover: false,
      coverBlock: null,
      walkPhase: 0,
    },
    extract: { ...tpl.extract },
    walls,
    segments,
    fuseboxes: tpl.fuseboxes.map((f) => ({ ...f })),
    lasers: tpl.lasers.map((l) => ({ ...l })),
    loots: tpl.loots.map((l) => ({ ...l })),
    cameras,
    guards,
    gadgets: { ...tpl.gadgets },
    maxGadgets: { ...tpl.gadgets },
    roomLabels: tpl.roomLabels.map((r) => ({ ...r })),
    empWaves: [],
    decoys: [],
    smokes: [],
    noiseRings: [],
    nearestInteract: null,
  };

  recomputeAllPolygons(state);
  return state;
}

export function recomputeAllPolygons(state) {
  for (const cam of state.cameras) {
    if (cam.disabledTimer > 0) cam.polygon = [];
    else cam.polygon = computeVisionPolygon(cam.x, cam.y, cam.angle, cam.fov, cam.range, state.segments, state.smokes);
  }
  for (const g of state.guards) {
    g.polygon = computeVisionPolygon(g.x, g.y, g.angle, g.fov, g.range, state.segments, state.smokes);
  }
  state.player.coverBlock = computePlayerCover(state.player, state.walls, state.guards, state.cameras);
  state.player.inCover = Boolean(state.player.coverBlock);
  state.nearestInteract = findNearestInteractable(state);
}

export function stepSimulation(state, input, dt, audio) {
  if (state.phase !== 'playing') {
    for (const w of state.empWaves) w.age = Math.min(w.maxAge, w.age + dt);
    return;
  }

  state.elapsed += dt;

  // Tick temporary timers
  for (const l of state.lasers) {
    if (l.disabledTimer > 0) l.disabledTimer = Math.max(0, l.disabledTimer - dt);
  }
  state.empWaves = state.empWaves.filter((w) => {
    w.age += dt;
    return w.age < w.maxAge;
  });
  state.decoys = state.decoys.filter((d) => {
    d.timer -= dt;
    return d.timer > 0;
  });
  state.smokes = state.smokes.filter((s) => {
    s.timer -= dt;
    return s.timer > 0;
  });
  state.noiseRings = state.noiseRings.filter((n) => {
    n.age += dt;
    return n.age < n.maxAge;
  });

  // Player movement
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  const moving = mx !== 0 || my !== 0;
  state.player.sprinting = moving && Boolean(input.sprint);
  if (moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = state.player.sprinting ? PLAYER_SPRINT_SPEED : PLAYER_WALK_SPEED;
    const nx = state.player.x + mx * speed * dt;
    const ny = state.player.y + my * speed * dt;
    const resolved = resolveCircleWalls(nx, ny, PLAYER_RADIUS, state.walls);
    state.player.x = resolved.x;
    state.player.y = resolved.y;
    state.player.angle = Math.atan2(my, mx);
    state.player.walkPhase += dt * (state.player.sprinting ? 14 : 9);
    audio.playFootstep(state.player.sprinting);

    if (state.player.sprinting && state.noiseRings.length < 3) {
      const last = state.noiseRings[state.noiseRings.length - 1];
      if (!last || last.age > 0.28) {
        state.noiseRings.push({ x: state.player.x, y: state.player.y, radius: SPRINT_NOISE_RADIUS, age: 0, maxAge: 0.45 });
      }
    }
  }

  // Update AI & vision cones
  updateStealthAI(state, dt, (x, y, r) => resolveCircleWalls(x, y, r, state.walls), audio);

  // Auto-loot side items or extract when standing right over hatch with primary loot
  for (const loot of state.loots) {
    if (!loot.stolen && Math.hypot(loot.x - state.player.x, loot.y - state.player.y) <= 26) {
      loot.stolen = true;
      state.haul += loot.value;
      if (loot.primary) {
        state.primaryLootStolen = true;
        state.statusNote = `${loot.name} lifted! Return to ${state.extract.label}`;
      } else {
        state.statusNote = `${loot.name} collected (+$${Math.round(loot.value / 1000)}K)`;
      }
      audio.playLoot();
    }
  }
  if (state.primaryLootStolen && Math.hypot(state.extract.x - state.player.x, state.extract.y - state.player.y) <= EXTRACTION_RADIUS - 10) {
    state.phase = 'getaway';
    state.extracted = true;
    state.statusNote = 'Clean Exfiltration Confirmed';
    audio.playGetaway();
  }

  state.nearestInteract = findNearestInteractable(state);
}

export function executeGadgetOrAction(state, action, pointerWorld, audio) {
  if (action === 'emp') return triggerEmpPulse(state, audio);
  if (action === 'decoy') return throwBrassDecoy(state, pointerWorld?.x ?? null, pointerWorld?.y ?? null, audio);
  if (action === 'smoke') return deploySmokeVeil(state, audio);
  if (action === 'interact') return performInteract(state, audio);
  return false;
}

export function computeGetawayGrade(state) {
  const stealthBonus = state.alarm < 25 ? 'PHANTOM' : state.alarm < 60 ? 'GHOST' : 'HEATED';
  const rank = state.alarm < 30 && state.haul >= 250000 ? 'S' : state.alarm < 70 ? 'A' : 'B';
  return { rank, stealthBonus };
}

export function applyShotPreset(shotName, seed = 1) {
  if (shotName === 'cover') {
    const s = createHeistState(0, seed);
    s.elapsed = 14.4;
    s.alarm = 38;
    s.player.x = 626;
    s.player.y = 290;
    s.player.angle = -0.1;
    s.gadgets = { emp: 2, decoy: 2, smoke: 2 };
    s.decoys.push({ x: 810, y: 174, timer: 3.8, maxTimer: 5.5 });
    s.guards[0].x = 794;
    s.guards[0].y = 282;
    s.guards[0].angle = 3.04;
    s.guards[0].state = 'suspicious';
    s.guards[0].suspicion = 0.58;
    s.guards[1].x = 582;
    s.guards[1].y = 515;
    s.guards[1].angle = -0.24;
    s.guards[2].x = 1042;
    s.guards[2].y = 330;
    s.guards[2].angle = 2.35;
    s.cameras[0].phase = 0.6;
    s.cameras[0].angle = s.cameras[0].baseAngle + 0.12;
    s.cameras[1].phase = 1.1;
    s.cameras[1].angle = s.cameras[1].baseAngle - 0.18;
    s.statusNote = 'Cover shelter active — lure Warden Vance with Brass Decoy';
    recomputeAllPolygons(s);
    return s;
  }

  if (shotName === 'gadgets') {
    const s = createHeistState(1, seed);
    s.elapsed = 24.8;
    s.alarm = 64;
    s.fuseboxes[0].hacked = true;
    s.lasers[0].hackedOff = true;
    s.lasers[1].disabledTimer = 4.2;
    s.cameras[0].disabledTimer = 4.2;
    s.player.x = 582;
    s.player.y = 202;
    s.player.angle = 0.25;
    s.gadgets = { emp: 1, decoy: 2, smoke: 2 };
    s.smokes.push({ x: 642, y: 215, radius: 74, timer: 4.1, maxTimer: 5.5 });
    s.empWaves.push({ x: 545, y: 155, radius: 250, age: 0.34, maxAge: 0.65 });
    s.decoys.push({ x: 760, y: 530, timer: 3.4, maxTimer: 5.5 });
    s.guards[0].x = 772;
    s.guards[0].y = 195;
    s.guards[0].angle = 3.06;
    s.guards[0].state = 'suspicious';
    s.guards[0].suspicion = 0.48;
    s.guards[1].x = 585;
    s.guards[1].y = 540;
    s.guards[1].angle = 0.15;
    s.guards[2].x = 1055;
    s.guards[2].y = 345;
    s.guards[2].angle = 2.95;
    s.loots[1].stolen = true;
    s.haul = 140000;
    s.statusNote = 'Smoke Veil slicing glass sightlines · North Camera EMP-disabled';
    recomputeAllPolygons(s);
    return s;
  }

  if (shotName === 'caught') {
    const s = createHeistState(2, seed);
    s.elapsed = 31.2;
    s.alarm = 100;
    s.phase = 'caught';
    s.player.x = 805;
    s.player.y = 355;
    s.player.angle = 0.05;
    s.loots[1].stolen = true;
    s.haul = 140000;
    s.guards[2].x = 682;
    s.guards[2].y = 355;
    s.guards[2].angle = 0.0;
    s.guards[2].state = 'alert';
    s.guards[2].suspicion = 1.0;
    s.guards[0].x = 520;
    s.guards[0].y = 190;
    s.guards[0].angle = 0.52;
    s.guards[1].x = 520;
    s.guards[1].y = 515;
    s.guards[1].angle = -0.45;
    s.guards[3].x = 1090;
    s.guards[3].y = 355;
    s.guards[3].angle = 3.1;
    s.cameras[2].suspicion = 0.85;
    s.caughtInfo = {
      kind: 'guard',
      name: 'Center Enforcer',
      x: s.guards[2].x,
      y: s.guards[2].y,
      reason: 'Center Enforcer caught you exposed past the monolith cover. Deploy [3] Smoke Veil or distract with [2] Brass Decoy.',
    };
    recomputeAllPolygons(s);
    return s;
  }

  // getaway
  const s = createHeistState(2, seed);
  s.elapsed = 44.6;
  s.alarm = 22;
  s.phase = 'getaway';
  s.extracted = true;
  s.primaryLootStolen = true;
  s.loots[0].stolen = true;
  s.loots[1].stolen = true;
  s.haul = 540000;
  s.toolsUsedCount = 4;
  s.fuseboxes[0].hacked = true;
  s.lasers[0].hackedOff = true;
  s.player.x = s.extract.x + 12;
  s.player.y = s.extract.y;
  s.player.angle = Math.PI;
  s.guards[0].x = 435;
  s.guards[0].y = 210;
  s.guards[0].angle = 2.6;
  s.guards[0].state = 'suspicious';
  s.guards[0].suspicion = 0.35;
  s.guards[2].x = 765;
  s.guards[2].y = 355;
  s.guards[2].angle = 3.14;
  s.smokes.push({ x: 288, y: 360, radius: 74, timer: 2.8, maxTimer: 5.5 });
  recomputeAllPolygons(s);
  return s;
}
