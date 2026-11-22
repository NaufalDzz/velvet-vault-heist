export const WORLD_W = 1280;
export const WORLD_H = 720;
export const FIXED_DT = 1 / 60;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 168;
export const PLAYER_SPRINT_SPEED = 258;
export const PLAYER_COVER_MARGIN = 18;
export const SPRINT_NOISE_RADIUS = 195;

export const GUARD_RADIUS = 14;
export const GUARD_PATROL_SPEED = 78;
export const GUARD_INVESTIGATE_SPEED = 104;
export const GUARD_CHASE_SPEED = 152;
export const GUARD_SUSPICION_RATE = 1.45;
export const GUARD_DECAY_RATE = 0.55;

export const CAMERA_SUSPICION_RATE = 1.15;
export const ALARM_GAIN_SUSPICIOUS = 16;
export const ALARM_GAIN_ALERT = 44;
export const ALARM_DECAY_CALM = 7;

export const EMP_RADIUS = 250;
export const EMP_DURATION = 6.0;
export const DECOY_RADIUS = 250;
export const DECOY_DURATION = 5.5;
export const DECOY_THROW_RANGE = 220;
export const SMOKE_RADIUS = 74;
export const SMOKE_DURATION = 5.5;

export const INTERACT_RADIUS = 56;
export const EXTRACTION_RADIUS = 46;

export const PALETTE = {
  floorBase: '#0b1019',
  floorTile: '#101826',
  floorInlay: 'rgba(212, 168, 79, 0.14)',
  blueprintGrid: 'rgba(148, 163, 184, 0.06)',
  wallFill: '#182235',
  wallBorder: '#c9a152',
  coverFill: '#111b2b',
  coverTop: '#1d2d44',
  coverRim: '#2dd4bf',
  glassFill: 'rgba(125, 211, 252, 0.22)',
  glassStroke: '#7dd3fc',
  conePatrolInner: 'rgba(245, 196, 81, 0.34)',
  conePatrolOuter: 'rgba(245, 196, 81, 0.04)',
  coneSuspiciousInner: 'rgba(249, 115, 22, 0.44)',
  coneSuspiciousOuter: 'rgba(249, 115, 22, 0.08)',
  coneAlertInner: 'rgba(239, 68, 68, 0.54)',
  coneAlertOuter: 'rgba(239, 68, 68, 0.12)',
  camConeInner: 'rgba(56, 189, 248, 0.32)',
  camConeOuter: 'rgba(56, 189, 248, 0.05)',
  camAlertInner: 'rgba(239, 68, 68, 0.50)',
  camAlertOuter: 'rgba(239, 68, 68, 0.10)',
  lootGold: '#fbbf24',
  lootGlow: 'rgba(251, 191, 36, 0.28)',
  extractEmerald: '#10b981',
  extractGlow: 'rgba(16, 185, 129, 0.28)',
  thiefCoat: '#1e293b',
  thiefScarf: '#f43f5e',
  guardUniform: '#334155',
  guardTrim: '#eab308',
};
