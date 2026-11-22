import { PALETTE, PLAYER_RADIUS, WORLD_H, WORLD_W } from './constants.js';

export function computeViewportTransform(canvasW, canvasH) {
  const padTop = 58;
  const padBottom = 56;
  const padSide = 12;
  const availW = Math.max(320, canvasW - padSide * 2);
  const availH = Math.max(240, canvasH - padTop - padBottom);
  const scale = Math.min(availW / WORLD_W, availH / WORLD_H);
  const ox = (canvasW - WORLD_W * scale) * 0.5;
  const oy = padTop + (availH - WORLD_H * scale) * 0.5;
  return { scale, ox, oy };
}

function drawFloorBlueprint(ctx, state) {
  ctx.fillStyle = PALETTE.floorBase;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Subtle terrazzo checkerboard slabs
  const tile = 64;
  ctx.fillStyle = PALETTE.floorTile;
  for (let gx = 24; gx < WORLD_W - 24; gx += tile) {
    for (let gy = 36; gy < WORLD_H - 22; gy += tile) {
      if (((gx / tile + gy / tile) | 0) % 2 === 0) {
        ctx.fillRect(gx, gy, Math.min(tile, WORLD_W - 24 - gx), Math.min(tile, WORLD_H - 22 - gy));
      }
    }
  }

  // Architectural blueprint grid
  ctx.strokeStyle = PALETTE.blueprintGrid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 32; x < WORLD_W; x += 32) {
    ctx.moveTo(x, 36);
    ctx.lineTo(x, WORLD_H - 22);
  }
  for (let y = 36; y < WORLD_H; y += 32) {
    ctx.moveTo(24, y);
    ctx.lineTo(WORLD_W - 24, y);
  }
  ctx.stroke();

  // Art Deco brass floor inlays around gallery wings
  ctx.strokeStyle = PALETTE.floorInlay;
  ctx.lineWidth = 2;
  ctx.strokeRect(54, 68, WORLD_W - 108, WORLD_H - 100);
  ctx.strokeRect(62, 76, WORLD_W - 124, WORLD_H - 116);

  // Etched floor wing labels
  ctx.save();
  ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = 'rgba(212, 168, 79, 0.34)';
  ctx.textAlign = 'center';
  for (const lbl of state.roomLabels) {
    ctx.fillText(lbl.text, lbl.x, lbl.y);
  }
  ctx.restore();
}

function drawPatrolTracksAndCircuits(ctx, state) {
  // Fusebox -> Laser circuit traces
  for (const fb of state.fuseboxes) {
    const laser = state.lasers.find((l) => l.id === fb.targetLaser);
    if (!laser) continue;
    const lx = (laser.x1 + laser.x2) * 0.5;
    const ly = (laser.y1 + laser.y2) * 0.5;
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = fb.hacked ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fb.x, fb.y);
    ctx.lineTo(lx, fb.y);
    ctx.lineTo(lx, ly);
    ctx.stroke();
    ctx.restore();
  }

  // Dashed guard patrol paths
  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(245, 196, 81, 0.22)';
  ctx.lineWidth = 1.6;
  for (const g of state.guards) {
    if (g.route.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(g.route[0].x, g.route[0].y);
    for (let i = 1; i < g.route.length; i++) {
      ctx.lineTo(g.route[i].x, g.route[i].y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawExtractionHatch(ctx, state) {
  const { x, y, label } = state.extract;
  const pulse = 0.72 + Math.sin(state.elapsed * 4.2) * 0.28;
  const active = state.primaryLootStolen;

  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 6, x, y, 52);
  grad.addColorStop(0, active ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.20)');
  grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 52, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = active ? '#34d399' : 'rgba(52, 211, 153, 0.65)';
  ctx.lineWidth = active ? 3 : 2;
  ctx.beginPath();
  ctx.arc(x, y, 30 * (active ? pulse * 0.12 + 0.92 : 1), 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(6, 78, 59, 0.55)';
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.fill();

  // Exit chevrons
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2.2;
  for (const offset of [-6, 3]) {
    ctx.beginPath();
    ctx.moveTo(x - 7, y + offset + 4);
    ctx.lineTo(x, y + offset - 3);
    ctx.lineTo(x + 7, y + offset + 4);
    ctx.stroke();
  }

  ctx.font = '800 10px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = active ? '#6ee7b7' : '#a7f3d0';
  ctx.fillText(active ? 'EXTRACT [E]' : 'ESCAPE HATCH', x, y + 42);
  ctx.font = '600 9px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(167, 243, 208, 0.65)';
  ctx.fillText(label, x, y + 54);
  ctx.restore();
}

function drawFuseboxesAndLasers(ctx, state) {
  for (const l of state.lasers) {
    if (l.hackedOff) {
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.restore();
      continue;
    }
    const disabled = l.disabledTimer > 0;
    ctx.save();
    ctx.strokeStyle = disabled ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.92)';
    ctx.lineWidth = disabled ? 2 : 4;
    if (disabled) ctx.setLineDash([6, 6]);
    ctx.shadowColor = disabled ? '#38bdf8' : '#ef4444';
    ctx.shadowBlur = disabled ? 6 : 14;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();

    // Emitter caps
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = disabled ? '#38bdf8' : '#fca5a5';
    ctx.lineWidth = 1.5;
    for (const [ex, ey] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const fb of state.fuseboxes) {
    ctx.save();
    ctx.fillStyle = fb.hacked ? '#064e3b' : '#1e293b';
    ctx.strokeStyle = fb.hacked ? '#34d399' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(fb.x - 13, fb.y - 10, 26, 20);
    ctx.strokeRect(fb.x - 13, fb.y - 10, 26, 20);

    // Breaker symbol
    ctx.fillStyle = fb.hacked ? '#6ee7b7' : '#7dd3fc';
    ctx.fillRect(fb.x - 6, fb.y - 3, 12, 6);

    ctx.font = '800 9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = fb.hacked ? '#6ee7b7' : '#bae6fd';
    ctx.fillText(fb.hacked ? 'OFFLINE' : 'FUSEBOX [E]', fb.x, fb.y + 22);
    ctx.restore();
  }
}

function drawLootTargets(ctx, state) {
  for (const loot of state.loots) {
    if (loot.stolen) {
      // Ghosted plinth showing lifted artifact
      const r = loot.primary ? 22 : 16;
      ctx.save();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + Math.PI / 8;
        const px = loot.x + Math.cos(a) * r;
        const py = loot.y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '800 8px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(110, 231, 183, 0.7)';
      ctx.fillText('LIFTED ✓', loot.x, loot.y + 3);
      ctx.restore();
      continue;
    }
    const pulse = 1 + Math.sin(state.elapsed * 3.6) * 0.09;
    const r = loot.primary ? 24 : 18;

    ctx.save();
    // Radiant floor halo
    const grad = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, r * 2.4);
    grad.addColorStop(0, loot.primary ? 'rgba(251, 191, 36, 0.55)' : 'rgba(56, 189, 248, 0.42)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Art Deco octagonal plinth
    ctx.fillStyle = '#1b160d';
    ctx.strokeStyle = loot.primary ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const px = loot.x + Math.cos(a) * r;
      const py = loot.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jewel diamond core
    ctx.fillStyle = loot.primary ? '#fde68a' : '#bae6fd';
    ctx.beginPath();
    const jr = (loot.primary ? 11 : 8) * pulse;
    ctx.moveTo(loot.x, loot.y - jr);
    ctx.lineTo(loot.x + jr, loot.y);
    ctx.lineTo(loot.x, loot.y + jr);
    ctx.lineTo(loot.x - jr, loot.y);
    ctx.closePath();
    ctx.fill();

    // Readable loot tag
    ctx.font = '800 10px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    const valStr = `$${Math.round(loot.value / 1000)}K`;
    const tag = loot.primary ? `TARGET · ${valStr}` : `BONUS · ${valStr}`;
    ctx.fillStyle = 'rgba(7, 11, 18, 0.85)';
    const w = ctx.measureText(tag).width + 12;
    ctx.fillRect(loot.x - w * 0.5, loot.y - r - 22, w, 15);
    ctx.strokeStyle = loot.primary ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(loot.x - w * 0.5, loot.y - r - 22, w, 15);
    ctx.fillStyle = loot.primary ? '#fde68a' : '#bae6fd';
    ctx.fillText(tag, loot.x, loot.y - r - 11);
    ctx.restore();
  }
}

function drawVisionCones(ctx, state) {
  // Camera cones first
  for (const cam of state.cameras) {
    if (cam.disabledTimer > 0 || cam.polygon.length < 2) continue;
    const alert = cam.suspicion > 0.25;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    for (const pt of cam.polygon) ctx.lineTo(pt.x, pt.y);
    ctx.closePath();
    const grad = ctx.createRadialGradient(cam.x, cam.y, 12, cam.x, cam.y, cam.range);
    grad.addColorStop(0, alert ? PALETTE.camAlertInner : PALETTE.camConeInner);
    grad.addColorStop(1, alert ? PALETTE.camAlertOuter : PALETTE.camConeOuter);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = alert ? 'rgba(248, 113, 113, 0.65)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // Guard raycasted cones
  for (const g of state.guards) {
    if (g.polygon.length < 2) continue;
    const isAlert = g.state === 'alert';
    const isSusp = g.state === 'suspicious';
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    for (const pt of g.polygon) ctx.lineTo(pt.x, pt.y);
    ctx.closePath();
    const grad = ctx.createRadialGradient(g.x, g.y, 14, g.x, g.y, g.range);
    grad.addColorStop(0, isAlert ? PALETTE.coneAlertInner : isSusp ? PALETTE.coneSuspiciousInner : PALETTE.conePatrolInner);
    grad.addColorStop(1, isAlert ? PALETTE.coneAlertOuter : isSusp ? PALETTE.coneSuspiciousOuter : PALETTE.conePatrolOuter);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.8)' : isSusp ? 'rgba(249, 115, 22, 0.7)' : 'rgba(245, 196, 81, 0.48)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
}

function drawArchitecture(ctx, state) {
  for (const w of state.walls) {
    ctx.save();
    if (w.kind === 'glass') {
      ctx.fillStyle = PALETTE.glassFill;
      ctx.strokeStyle = PALETTE.glassStroke;
      ctx.lineWidth = 2.2;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
      // Specular glass slashes
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.lineWidth = 1.4;
      const midX = w.x + w.w * 0.5;
      for (let sy = w.y + 18; sy < w.y + w.h - 14; sy += 28) {
        ctx.beginPath();
        ctx.moveTo(midX - 5, sy + 9);
        ctx.lineTo(midX + 5, sy - 9);
        ctx.stroke();
      }
      // Blueprint glass indicator tag
      if (w.h >= 120) {
        ctx.save();
        ctx.translate(midX, w.y + w.h * 0.5);
        ctx.rotate(-Math.PI * 0.5);
        ctx.font = '800 8px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(10, 15, 25, 0.84)';
        ctx.fillRect(-22, -6, 44, 12);
        ctx.fillStyle = '#bae6fd';
        ctx.fillText('GLASS', 0, 3);
        ctx.restore();
      }
    } else if (w.kind === 'cover') {
      // Soft architectural drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
      ctx.fillRect(w.x + 6, w.y + 8, w.w, w.h);

      // Beveled obsidian monolith body
      ctx.fillStyle = PALETTE.coverFill;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PALETTE.coverTop;
      ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, w.h - 12);

      // Diagonal Art Deco highlight facet
      ctx.fillStyle = 'rgba(45, 212, 191, 0.06)';
      ctx.beginPath();
      ctx.moveTo(w.x + 6, w.y + 6);
      ctx.lineTo(w.x + w.w - 6, w.y + 6);
      ctx.lineTo(w.x + 6, w.y + w.h - 6);
      ctx.closePath();
      ctx.fill();

      // Safe-cover cyan/emerald rim
      const shelteredHere = state.player.coverBlock === w;
      ctx.strokeStyle = shelteredHere ? '#34d399' : PALETTE.coverRim;
      ctx.lineWidth = shelteredHere ? 3 : 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);

      // Corner brass rivets
      ctx.fillStyle = shelteredHere ? '#6ee7b7' : '#d4a84f';
      for (const [rx, ry] of [
        [w.x + 4, w.y + 4],
        [w.x + w.w - 4, w.y + 4],
        [w.x + 4, w.y + w.h - 4],
        [w.x + w.w - 4, w.y + w.h - 4],
      ]) {
        ctx.beginPath();
        ctx.arc(rx, ry, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '800 8.5px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = shelteredHere ? 'rgba(110, 231, 183, 0.92)' : 'rgba(94, 234, 212, 0.56)';
      ctx.fillText('COVER', w.x + w.w * 0.5, w.y + w.h * 0.5 + 3);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(w.x + 3, w.y + 4, w.w, w.h);
      ctx.fillStyle = PALETTE.wallFill;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = PALETTE.wallBorder;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }
    ctx.restore();
  }
}

function drawGadgetVFX(ctx, state) {
  // Decoy gold sound ripples & coin
  for (const d of state.decoys) {
    ctx.save();
    for (let k = 0; k < 3; k++) {
      const phase = ((state.elapsed * 1.4 + k * 0.33) % 1);
      const r = 14 + phase * 115;
      ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - phase) * 0.72})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '800 9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde68a';
    ctx.fillText('DECOY LURE', d.x, d.y - 14);
    ctx.restore();
  }

  // Sprint footstep rings
  for (const nr of state.noiseRings) {
    const t = nr.age / nr.maxAge;
    ctx.save();
    ctx.strokeStyle = `rgba(244, 63, 94, ${(1 - t) * 0.55})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(nr.x, nr.y, 18 + t * (nr.radius - 18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // EMP shockwaves
  for (const w of state.empWaves) {
    const t = w.age / w.maxAge;
    const r = 18 + t * w.radius;
    ctx.save();
    ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - t) * 0.95})`;
    ctx.lineWidth = 5 * (1 - t * 0.4);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - t) * 0.7})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(w.x, w.y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = `rgba(56, 189, 248, ${(1 - t) * 0.16})`;
    ctx.beginPath();
    ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Volumetric Smoke Veil clouds
  for (const sm of state.smokes) {
    const fade = Math.min(1, sm.timer / 0.8);
    ctx.save();
    const grad = ctx.createRadialGradient(sm.x, sm.y, 10, sm.x, sm.y, sm.radius);
    grad.addColorStop(0, `rgba(203, 213, 225, ${0.88 * fade})`);
    grad.addColorStop(0.65, `rgba(45, 212, 191, ${0.42 * fade})`);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
    ctx.fill();

    // Layered mist puffs
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + state.elapsed * 0.4;
      const px = sm.x + Math.cos(a) * sm.radius * 0.38;
      const py = sm.y + Math.sin(a) * sm.radius * 0.38;
      ctx.fillStyle = `rgba(226, 232, 240, ${0.30 * fade})`;
      ctx.beginPath();
      ctx.arc(px, py, sm.radius * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(94, 234, 212, ${0.85 * fade})`;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '800 9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`SMOKE ${sm.timer.toFixed(1)}s`, sm.x, sm.y + 3);
    ctx.restore();
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    const disabled = cam.disabledTimer > 0;
    ctx.save();
    // Sweep arc indicator
    if (!disabled) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 26, cam.baseAngle - cam.sweepSpan * 0.5, cam.baseAngle + cam.sweepSpan * 0.5);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);

    // Mount bracket & housing
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = disabled ? '#38bdf8' : cam.suspicion > 0.25 ? '#ef4444' : '#e2e8f0';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Swiveling camera lens barrel
    ctx.fillStyle = disabled ? '#0369a1' : '#38bdf8';
    ctx.fillRect(4, -4.5, 11, 9);

    // LED dot
    ctx.fillStyle = disabled ? '#38bdf8' : cam.suspicion > 0.25 ? '#ef4444' : '#22d3ee';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '800 9px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (disabled) {
      const tag = `EMP OFFLINE ${cam.disabledTimer.toFixed(1)}s`;
      const tw = ctx.measureText(tag).width + 10;
      ctx.fillStyle = 'rgba(7, 11, 18, 0.88)';
      ctx.fillRect(cam.x - tw * 0.5, cam.y + 15, tw, 14);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cam.x - tw * 0.5, cam.y + 15, tw, 14);
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText(tag, cam.x, cam.y + 25);
    } else {
      ctx.fillStyle = '#bae6fd';
      ctx.fillText(`CAM ${cam.id.toUpperCase()}`, cam.x, cam.y + 23);
    }
    ctx.restore();
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    const isAlert = g.state === 'alert';
    const isSusp = g.state === 'suspicious';
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(2, 3, 15, 0, Math.PI * 2);
    ctx.fill();

    // Shoulders
    ctx.fillStyle = isAlert ? '#7f1d1d' : isSusp ? '#78350f' : PALETTE.guardUniform;
    ctx.strokeStyle = isAlert ? '#ef4444' : isSusp ? '#f59e0b' : PALETTE.guardTrim;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flashlight barrel
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(9, 4, 8, 4);

    // Peaked cap
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isAlert ? '#f87171' : '#facc15';
    ctx.fillRect(3, -3.5, 5, 7);
    ctx.restore();

    // Suspicion arc & icon
    if (g.suspicion > 0.04 || g.state !== 'patrol') {
      ctx.save();
      ctx.strokeStyle = isAlert ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * Math.max(0.15, g.suspicion));
      ctx.stroke();

      ctx.font = '900 13px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = isAlert ? '#fca5a5' : '#fde68a';
      ctx.fillText(isAlert ? '!' : '?', g.x, g.y - 23);
      ctx.restore();
    }
  }
}

function drawThief(ctx, state) {
  const { player } = state;
  ctx.save();
  // High-contrast thief aura & cover shelter ring
  if (state.phase === 'playing') {
    ctx.strokeStyle = player.inCover ? '#34d399' : 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = player.inCover ? 2.8 : 1.6;
    if (player.inCover) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  ctx.beginPath();
  ctx.arc(2, 3, PLAYER_RADIUS + 3, 0, Math.PI * 2);
  ctx.fill();

  // Trench coat shoulders (scaled for crisp thumbnail silhouette)
  ctx.fillStyle = PALETTE.thiefCoat;
  ctx.strokeStyle = player.inCover ? '#34d399' : '#f4efe6';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crimson silk scarf & hood
  ctx.fillStyle = PALETTE.thiefScarf;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 6.5, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(3, 0, 8, 0, Math.PI * 2);
  ctx.fill();

  // Cyan night-optics visor
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(7.5, -4, 4, 8);
  ctx.restore();

  // Floating IN COVER / ESCAPED / DETECTED / INTERACT badges
  ctx.font = '900 10px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (state.phase === 'getaway') {
    ctx.fillStyle = 'rgba(6, 78, 59, 0.96)';
    ctx.fillRect(player.x - 42, player.y - 38, 84, 16);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(player.x - 42, player.y - 38, 84, 16);
    ctx.fillStyle = '#fde68a';
    ctx.fillText('CROWN SECURED', player.x, player.y - 26);
  } else if (state.phase === 'caught') {
    ctx.fillStyle = 'rgba(127, 29, 29, 0.96)';
    ctx.fillRect(player.x - 36, player.y - 38, 72, 16);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(player.x - 36, player.y - 38, 72, 16);
    ctx.fillStyle = '#fecaca';
    ctx.fillText('! DETECTED', player.x, player.y - 26);
  } else if (player.inCover) {
    ctx.fillStyle = 'rgba(6, 78, 59, 0.96)';
    ctx.fillRect(player.x - 34, player.y - 38, 68, 16);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(player.x - 34, player.y - 38, 68, 16);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText('IN COVER', player.x, player.y - 26);
  } else if (state.nearestInteract) {
    const lbl = '[E] ACT';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(player.x - 28, player.y - 38, 56, 16);
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(player.x - 28, player.y - 38, 56, 16);
    ctx.fillStyle = '#fde68a';
    ctx.fillText(lbl, player.x, player.y - 26);
  } else {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(player.x - 24, player.y - 37, 48, 14);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - 24, player.y - 37, 48, 14);
    ctx.fillStyle = '#fda4af';
    ctx.fillText('THIEF', player.x, player.y - 27);
  }
  ctx.restore();
}

function drawCaughtTether(ctx, state) {
  if (state.phase === 'getaway') {
    // Emerald escape trail behind extracting thief
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(460, 360);
    ctx.lineTo(state.player.x + 22, state.player.y);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (state.phase !== 'caught' || !state.caughtInfo) return;
  const c = state.caughtInfo;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(c.x, c.y);
  ctx.lineTo(state.player.x, state.player.y);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, 26, 0, Math.PI * 2);
  ctx.stroke();

  // Subtle crimson perimeter vignette
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, WORLD_W - 12, WORLD_H - 12);
  ctx.restore();
}

export function renderWorld(ctx, canvasW, canvasH, state, pointerWorld) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#070b12';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const tf = computeViewportTransform(canvasW, canvasH);
  ctx.save();
  ctx.translate(tf.ox, tf.oy);
  ctx.scale(tf.scale, tf.scale);

  drawFloorBlueprint(ctx, state);
  drawPatrolTracksAndCircuits(ctx, state);
  drawExtractionHatch(ctx, state);
  drawFuseboxesAndLasers(ctx, state);
  drawLootTargets(ctx, state);
  drawVisionCones(ctx, state);
  drawArchitecture(ctx, state);
  drawGadgetVFX(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawCaughtTether(ctx, state);

  // Subtle decoy aim reticle when armed
  if (state.armedTool === 'decoy' && pointerWorld && state.phase === 'playing') {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pointerWorld.x, pointerWorld.y, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
  return tf;
}
