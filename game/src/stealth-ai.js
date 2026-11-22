import {
  ALARM_DECAY_CALM,
  ALARM_GAIN_ALERT,
  ALARM_GAIN_SUSPICIOUS,
  CAMERA_SUSPICION_RATE,
  DECOY_RADIUS,
  GUARD_CHASE_SPEED,
  GUARD_DECAY_RATE,
  GUARD_INVESTIGATE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_SUSPICION_RATE,
  PLAYER_COVER_MARGIN,
  PLAYER_RADIUS,
} from './constants.js';
import { angleDiff, computeVisionPolygon, isPointInCone, normalizeAngle } from './vision.js';

function moveTowards(entity, tx, ty, speed, dt, resolveCollision) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const targetAngle = Math.atan2(dy, dx);
  const diff = angleDiff(targetAngle, entity.angle);
  entity.angle = normalizeAngle(entity.angle + Math.max(-dt * 5.2, Math.min(dt * 5.2, diff)));
  const step = Math.min(dist, speed * dt);
  const nx = entity.x + (dx / dist) * step;
  const ny = entity.y + (dy / dist) * step;
  const resolved = resolveCollision(nx, ny, GUARD_RADIUS);
  entity.x = resolved.x;
  entity.y = resolved.y;
  return dist <= step + 2;
}

export function computePlayerCover(player, walls, guards, cameras) {
  const threats = [];
  for (const g of guards) threats.push({ x: g.x, y: g.y });
  for (const c of cameras) if (c.disabledTimer <= 0) threats.push({ x: c.x, y: c.y });

  for (const w of walls) {
    if (w.kind !== 'cover') continue;
    const cx = Math.max(w.x, Math.min(player.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(player.y, w.y + w.h));
    const dist = Math.hypot(player.x - cx, player.y - cy);
    if (dist <= PLAYER_RADIUS + PLAYER_COVER_MARGIN) {
      if (threats.length === 0) return w;
      const monCx = w.x + w.w * 0.5;
      const monCy = w.y + w.h * 0.5;
      const pvx = player.x - monCx;
      const pvy = player.y - monCy;
      for (const t of threats) {
        const tvx = t.x - monCx;
        const tvy = t.y - monCy;
        if (pvx * tvx + pvy * tvy < 0) {
          return w;
        }
      }
      return w;
    }
  }
  return null;
}

export function updateStealthAI(state, dt, resolveCollision, audio) {
  const { player, guards, cameras, segments, smokes, decoys, noiseRings, walls } = state;

  player.coverBlock = computePlayerCover(player, walls, guards, cameras);
  player.inCover = Boolean(player.coverBlock);

  let anySuspicious = false;
  let anyAlert = false;
  let caughtBy = null;

  for (const cam of cameras) {
    if (cam.disabledTimer > 0) {
      cam.disabledTimer = Math.max(0, cam.disabledTimer - dt);
      cam.suspicion = Math.max(0, cam.suspicion - dt * 1.2);
      cam.polygon = [];
      continue;
    }
    cam.phase += dt * cam.sweepSpeed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweepSpan * 0.5;
    cam.polygon = computeVisionPolygon(cam.x, cam.y, cam.angle, cam.fov, cam.range, segments, smokes);

    const spotted = isPointInCone(cam.x, cam.y, cam.angle, cam.fov, cam.range, player.x, player.y, segments, smokes);
    if (spotted) {
      const coverScale = player.inCover ? 0.65 : 1.0;
      cam.suspicion = Math.min(1, cam.suspicion + dt * CAMERA_SUSPICION_RATE * coverScale);
      anySuspicious = true;
      if (cam.suspicion >= 0.99) {
        anyAlert = true;
        caughtBy = {
          kind: 'camera',
          name: `Security Camera ${cam.id.toUpperCase()}`,
          x: cam.x,
          y: cam.y,
          reason: `Sweeping security camera ${cam.id.toUpperCase()} locked onto your silhouette. Use [1] EMP Pulse or hug cover before crossing.`,
        };
      }
    } else {
      cam.suspicion = Math.max(0, cam.suspicion - dt * 0.6);
    }
  }

  for (const g of guards) {
    // Check acoustic lures (active decoys or sprint footsteps)
    for (const d of decoys) {
      if (Math.hypot(d.x - g.x, d.y - g.y) <= DECOY_RADIUS && g.state !== 'alert') {
        g.state = 'suspicious';
        g.investigateTarget = { x: d.x, y: d.y };
        g.investigateTimer = 4.2;
      }
    }
    for (const nr of noiseRings) {
      if (Math.hypot(nr.x - g.x, nr.y - g.y) <= nr.radius && g.state === 'patrol') {
        g.state = 'suspicious';
        g.investigateTarget = { x: nr.x, y: nr.y };
        g.investigateTimer = 3.0;
      }
    }

    const seesPlayer = isPointInCone(g.x, g.y, g.angle, g.fov, g.range, player.x, player.y, segments, smokes);
    if (seesPlayer) {
      const dist = Math.hypot(player.x - g.x, player.y - g.y);
      const proximityBoost = 0.85 + (1 - Math.min(1, dist / g.range)) * 1.15;
      const prevSusp = g.suspicion;
      g.suspicion = Math.min(1, g.suspicion + dt * GUARD_SUSPICION_RATE * proximityBoost);
      g.lastKnown = { x: player.x, y: player.y };
      if (prevSusp < 0.25 && g.suspicion >= 0.25) audio.playSuspicion();

      if (g.suspicion >= 0.96) {
        g.state = 'alert';
        anyAlert = true;
        caughtBy = {
          kind: 'guard',
          name: g.name,
          x: g.x,
          y: g.y,
          reason: `${g.name} caught you cleanly inside their sight cone. Lure patrols away with [2] Brass Decoy or veil yourself with [3] Smoke.`,
        };
      } else if (g.suspicion >= 0.18) {
        g.state = 'suspicious';
        g.investigateTarget = { x: player.x, y: player.y };
        g.investigateTimer = 3.5;
        anySuspicious = true;
      }
    } else {
      g.suspicion = Math.max(0, g.suspicion - dt * GUARD_DECAY_RATE);
      if (g.state === 'alert' && g.suspicion < 0.35) {
        g.state = 'suspicious';
        g.investigateTimer = 3.2;
      }
    }

    // Movement state machine
    if (g.state === 'alert' && g.lastKnown) {
      moveTowards(g, g.lastKnown.x, g.lastKnown.y, GUARD_CHASE_SPEED, dt, resolveCollision);
    } else if (g.state === 'suspicious' && g.investigateTarget) {
      const arrived = moveTowards(g, g.investigateTarget.x, g.investigateTarget.y, GUARD_INVESTIGATE_SPEED, dt, resolveCollision);
      if (arrived) {
        g.investigateTimer -= dt;
        g.angle = normalizeAngle(g.angle + Math.sin(state.elapsed * 3.5) * dt * 1.8);
        if (g.investigateTimer <= 0) {
          g.state = 'patrol';
          g.investigateTarget = null;
        }
      }
      anySuspicious = true;
    } else {
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
        g.angle = normalizeAngle(g.angle + Math.sin(state.elapsed * 1.9 + g.wpIndex) * dt * 0.55);
      } else {
        const wp = g.route[g.wpIndex];
        const arrived = moveTowards(g, wp.x, wp.y, GUARD_PATROL_SPEED, dt, resolveCollision);
        if (arrived) {
          g.wpIndex = (g.wpIndex + 1) % g.route.length;
          g.pauseTimer = 0.65;
        }
      }
    }

    g.polygon = computeVisionPolygon(g.x, g.y, g.angle, g.fov, g.range, segments, smokes);
  }

  // Laser tripwire collision
  for (const laser of state.lasers) {
    if (laser.hackedOff || laser.disabledTimer > 0) continue;
    const minX = Math.min(laser.x1, laser.x2) - 8;
    const maxX = Math.max(laser.x1, laser.x2) + 8;
    const minY = Math.min(laser.y1, laser.y2) - 8;
    const maxY = Math.max(laser.y1, laser.y2) + 8;
    if (player.x >= minX && player.x <= maxX && player.y >= minY && player.y <= maxY) {
      anyAlert = true;
      caughtBy = {
        kind: 'laser',
        name: 'Syndicate Laser Tripwire',
        x: (laser.x1 + laser.x2) * 0.5,
        y: (laser.y1 + laser.y2) * 0.5,
        reason: 'Crossed an armed crimson laser barrier. Hack its matching [E] Fusebox or disrupt it temporarily with [1] EMP Pulse.',
      };
    }
  }

  if (caughtBy) {
    state.alarm = 100;
    state.phase = 'caught';
    state.caughtInfo = caughtBy;
    audio.playAlarm();
    return;
  }

  if (anyAlert) {
    state.alarm = Math.min(100, state.alarm + ALARM_GAIN_ALERT * dt);
  } else if (anySuspicious) {
    state.alarm = Math.min(92, state.alarm + ALARM_GAIN_SUSPICIOUS * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY_CALM * dt);
  }

  if (state.alarm >= 100) {
    state.phase = 'caught';
    state.caughtInfo = {
      kind: 'alarm',
      name: 'Syndicate Lockdown',
      x: player.x,
      y: player.y,
      reason: 'Global facility Alarm Meter hit 100% lockdown due to sustained detection.',
    };
    audio.playAlarm();
  }
}
