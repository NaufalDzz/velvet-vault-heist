const EPS = 0.00075;

export function normalizeAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

export function angleDiff(a, b) {
  return normalizeAngle(a - b);
}

export function buildOpaqueSegments(walls) {
  const segs = [];
  for (const w of walls) {
    if (w.kind === 'glass') continue;
    const x1 = w.x;
    const y1 = w.y;
    const x2 = w.x + w.w;
    const y2 = w.y + w.h;
    segs.push({ x1, y1, x2, y1 });
    segs.push({ x1: x2, y1, x2, y2 });
    segs.push({ x1: x2, y1: y2, x2: x1, y2 });
    segs.push({ x1, y1: y2, x2: x1, y1 });
  }
  return segs;
}

function raySegmentHit(ox, oy, dx, dy, seg) {
  const sx = seg.x2 - seg.x1;
  const sy = seg.y2 - seg.y1;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-8) return Infinity;
  const qpx = seg.x1 - ox;
  const qpy = seg.y1 - oy;
  const t = (qpx * sy - qpy * sx) / denom;
  const u = (qpx * dy - qpy * dx) / denom;
  if (t >= 0 && u >= -1e-6 && u <= 1 + 1e-6) {
    return t;
  }
  return Infinity;
}

function rayCircleHit(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const disc = b * b - 4 * c;
  if (disc < 0) return Infinity;
  const sqrtD = Math.sqrt(disc);
  const t1 = (-b - sqrtD) / 2;
  if (t1 >= 0) return t1;
  return Infinity;
}

export function castVisionRay(ox, oy, angle, maxDist, segments, smokes) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = maxDist;
  for (const seg of segments) {
    const t = raySegmentHit(ox, oy, dx, dy, seg);
    if (t < best) best = t;
  }
  for (const sm of smokes) {
    const t = rayCircleHit(ox, oy, dx, dy, sm.x, sm.y, sm.radius * 0.88);
    if (t < best) best = t;
  }
  return {
    x: ox + dx * best,
    y: oy + dy * best,
    dist: best,
    angle,
  };
}

export function computeVisionPolygon(ox, oy, dirAngle, fov, range, segments, smokes) {
  const halfFov = fov * 0.5;
  const minA = dirAngle - halfFov;
  const maxA = dirAngle + halfFov;
  const angles = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    angles.push(minA + (fov * i) / steps);
  }
  const rangeSq = (range + 16) * (range + 16);
  for (const seg of segments) {
    const pts = [
      [seg.x1, seg.y1],
      [seg.x2, seg.y2],
    ];
    for (const [px, py] of pts) {
      const dx = px - ox;
      const dy = py - oy;
      if (dx * dx + dy * dy > rangeSq) continue;
      const a = Math.atan2(dy, dx);
      const d = angleDiff(a, dirAngle);
      if (Math.abs(d) <= halfFov + 0.02) {
        const clamped = dirAngle + d;
        angles.push(Math.max(minA, Math.min(maxA, clamped - EPS)));
        angles.push(Math.max(minA, Math.min(maxA, clamped)));
        angles.push(Math.max(minA, Math.min(maxA, clamped + EPS)));
      }
    }
  }
  for (const sm of smokes) {
    const dx = sm.x - ox;
    const dy = sm.y - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > range + sm.radius || dist < 1e-3) continue;
    const centerA = Math.atan2(dy, dx);
    const tangentOffset = Math.asin(Math.min(0.99, (sm.radius * 0.88) / dist));
    for (const edge of [centerA - tangentOffset, centerA + tangentOffset]) {
      const d = angleDiff(edge, dirAngle);
      if (Math.abs(d) <= halfFov + 0.04) {
        const c = dirAngle + d;
        angles.push(Math.max(minA, Math.min(maxA, c - EPS)));
        angles.push(Math.max(minA, Math.min(maxA, c)));
        angles.push(Math.max(minA, Math.min(maxA, c + EPS)));
      }
    }
  }
  angles.sort((a, b) => a - b);
  const deduped = [];
  for (const a of angles) {
    if (deduped.length === 0 || Math.abs(a - deduped[deduped.length - 1]) > 0.0002) {
      deduped.push(a);
    }
  }
  return deduped.map((a) => castVisionRay(ox, oy, a, range, segments, smokes));
}

export function hasLineOfSight(ox, oy, tx, ty, segments, smokes) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-4) return true;
  const hit = castVisionRay(ox, oy, Math.atan2(dy, dx), dist, segments, smokes);
  return hit.dist >= dist - 2;
}

export function isPointInCone(ox, oy, dirAngle, fov, range, tx, ty, segments, smokes) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  const targetA = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(targetA, dirAngle)) > fov * 0.5) return false;
  return hasLineOfSight(ox, oy, tx, ty, segments, smokes);
}
