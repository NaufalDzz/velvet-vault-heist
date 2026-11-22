import {
  DECOY_DURATION,
  DECOY_THROW_RANGE,
  EMP_DURATION,
  EMP_RADIUS,
  EXTRACTION_RADIUS,
  INTERACT_RADIUS,
  SMOKE_DURATION,
  SMOKE_RADIUS,
} from './constants.js';

export function triggerEmpPulse(state, audio) {
  if (state.phase !== 'playing' || state.gadgets.emp <= 0) return false;
  state.gadgets.emp -= 1;
  state.toolsUsedCount += 1;
  const { x, y } = state.player;
  state.empWaves.push({ x, y, radius: EMP_RADIUS, age: 0, maxAge: 0.65 });

  let disabledCount = 0;
  for (const cam of state.cameras) {
    if (Math.hypot(cam.x - x, cam.y - y) <= EMP_RADIUS + 20) {
      cam.disabledTimer = EMP_DURATION;
      cam.suspicion = 0;
      disabledCount += 1;
    }
  }
  for (const laser of state.lasers) {
    const mx = (laser.x1 + laser.x2) * 0.5;
    const my = (laser.y1 + laser.y2) * 0.5;
    if (Math.hypot(mx - x, my - y) <= EMP_RADIUS + 20) {
      laser.disabledTimer = EMP_DURATION;
      disabledCount += 1;
    }
  }
  state.statusNote = disabledCount > 0
    ? `EMP Pulse knocked ${disabledCount} grid node(s) offline for ${EMP_DURATION.toFixed(0)}s`
    : 'EMP Pulse discharged — no security nodes within radius';
  audio.playEmp();
  return true;
}

export function throwBrassDecoy(state, aimX, aimY, audio) {
  if (state.phase !== 'playing' || state.gadgets.decoy <= 0) return false;
  state.gadgets.decoy -= 1;
  state.toolsUsedCount += 1;

  let tx = aimX;
  let ty = aimY;
  if (tx === null || ty === null || Number.isNaN(tx)) {
    tx = state.player.x + Math.cos(state.player.angle) * 145;
    ty = state.player.y + Math.sin(state.player.angle) * 145;
  } else {
    const dx = tx - state.player.x;
    const dy = ty - state.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > DECOY_THROW_RANGE) {
      tx = state.player.x + (dx / dist) * DECOY_THROW_RANGE;
      ty = state.player.y + (dy / dist) * DECOY_THROW_RANGE;
    }
  }
  tx = Math.max(64, Math.min(1216, tx));
  ty = Math.max(76, Math.min(644, ty));

  state.decoys.push({ x: tx, y: ty, timer: DECOY_DURATION, maxTimer: DECOY_DURATION });
  state.armedTool = null;
  state.statusNote = 'Brass Decoy chiming — nearby patrols diverted';
  audio.playDecoy();
  return true;
}

export function deploySmokeVeil(state, audio) {
  if (state.phase !== 'playing' || state.gadgets.smoke <= 0) return false;
  state.gadgets.smoke -= 1;
  state.toolsUsedCount += 1;
  state.smokes.push({
    x: state.player.x,
    y: state.player.y,
    radius: SMOKE_RADIUS,
    timer: SMOKE_DURATION,
    maxTimer: SMOKE_DURATION,
  });
  state.statusNote = `Smoke Veil deployed — sightlines occluded for ${SMOKE_DURATION.toFixed(0)}s`;
  audio.playSmoke();
  return true;
}

export function findNearestInteractable(state) {
  if (state.phase !== 'playing') return null;
  const { x, y } = state.player;
  for (const loot of state.loots) {
    if (!loot.stolen && Math.hypot(loot.x - x, loot.y - y) <= INTERACT_RADIUS) {
      return { kind: 'loot', item: loot, label: `LIFT ${loot.name}` };
    }
  }
  for (const fb of state.fuseboxes) {
    if (!fb.hacked && Math.hypot(fb.x - x, fb.y - y) <= INTERACT_RADIUS) {
      return { kind: 'fusebox', item: fb, label: `HACK ${fb.label}` };
    }
  }
  if (state.primaryLootStolen && Math.hypot(state.extract.x - x, state.extract.y - y) <= EXTRACTION_RADIUS + 14) {
    return { kind: 'extract', item: state.extract, label: 'EXTRACT NOW' };
  }
  return null;
}

export function performInteract(state, audio) {
  if (state.phase !== 'playing') return false;
  const target = findNearestInteractable(state);
  if (!target) return false;

  if (target.kind === 'loot') {
    const loot = target.item;
    loot.stolen = true;
    state.haul += loot.value;
    if (loot.primary) {
      state.primaryLootStolen = true;
      state.statusNote = `${loot.name} secured! Return to ${state.extract.label}`;
    } else {
      state.statusNote = `Bonus artifact secured: ${loot.name} (+$${Math.round(loot.value / 1000)}K)`;
    }
    audio.playLoot();
    return true;
  }

  if (target.kind === 'fusebox') {
    const fb = target.item;
    fb.hacked = true;
    for (const laser of state.lasers) {
      if (laser.id === fb.targetLaser) laser.hackedOff = true;
    }
    state.statusNote = `${fb.label} bypassed — linked laser gate powered down`;
    audio.playHack();
    return true;
  }

  if (target.kind === 'extract') {
    state.phase = 'getaway';
    state.extracted = true;
    state.statusNote = 'Clean Exfiltration Confirmed';
    audio.playGetaway();
    return true;
  }
  return false;
}
