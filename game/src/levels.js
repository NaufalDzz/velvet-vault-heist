export const WINGS = [
  {
    id: 0,
    code: 'WING I',
    name: 'THE AMBER GALLERY',
    subtitle: '3 Routes · Fusebox Bypass · Dual Patrols & Vault Reliquary',
    spawn: { x: 112, y: 576 },
    extract: { x: 112, y: 576, label: 'WEST TERRACE HATCH' },
    gadgets: { emp: 2, decoy: 3, smoke: 2 },
    roomLabels: [
      { x: 185, y: 105, text: 'NORTH SERVICE CORRIDOR' },
      { x: 635, y: 92, text: 'RELIQUARY ROTUNDA' },
      { x: 1055, y: 105, text: 'VAULT ANTECHAMBER' },
      { x: 525, y: 636, text: 'SOUTH CHALICE ALCOVE' },
    ],
    walls: [
      // Outer gallery perimeter
      { x: 24, y: 36, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 662, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 58, w: 22, h: 604, kind: 'wall' },
      { x: 1234, y: 58, w: 22, h: 604, kind: 'wall' },
      // Architectural gallery dividers with three distinct doorways
      { x: 350, y: 58, w: 22, h: 118, kind: 'wall' },
      { x: 350, y: 268, w: 22, h: 170, kind: 'wall' },
      { x: 350, y: 528, w: 22, h: 134, kind: 'wall' },
      // Glass partition revealing center gallery sightline
      { x: 520, y: 188, w: 18, h: 144, kind: 'glass' },
      // East vault framing walls (north service bypass vs main rotunda entry vs south vault flank)
      { x: 870, y: 58, w: 22, h: 130, kind: 'wall' },
      { x: 870, y: 280, w: 22, h: 165, kind: 'wall' },
      { x: 870, y: 535, w: 22, h: 127, kind: 'wall' },
      // Safe obsidian cover monoliths
      { x: 205, y: 285, w: 72, h: 86, kind: 'cover' },
      { x: 465, y: 390, w: 84, h: 74, kind: 'cover' },
      { x: 655, y: 248, w: 92, h: 78, kind: 'cover' },
      { x: 660, y: 455, w: 86, h: 72, kind: 'cover' },
      { x: 965, y: 195, w: 76, h: 76, kind: 'cover' },
      { x: 965, y: 425, w: 76, h: 76, kind: 'cover' },
    ],
    fuseboxes: [
      { id: 'f1', x: 446, y: 102, label: 'NORTH BREAKER', targetLaser: 'l1', hacked: false },
    ],
    lasers: [
      { id: 'l1', x1: 881, y1: 188, x2: 881, y2: 280, disabledTimer: 0, hackedOff: false },
    ],
    loots: [
      { id: 'main', x: 1126, y: 355, name: 'AMBER SUNBURST RELIQUARY', value: 250000, primary: true, stolen: false },
      { id: 'side', x: 698, y: 605, name: 'SAPPHIRE CHALICE', value: 120000, primary: false, stolen: false },
    ],
    cameras: [
      { id: 'c1', x: 382, y: 84, baseAngle: 0.72, sweepSpan: 0.85, sweepSpeed: 0.75, range: 270, fov: 0.62, phase: 0.2, disabledTimer: 0, suspicion: 0 },
      { id: 'c2', x: 1218, y: 112, baseAngle: 2.55, sweepSpan: 0.92, sweepSpeed: 0.82, range: 295, fov: 0.64, phase: 1.4, disabledTimer: 0, suspicion: 0 },
    ],
    guards: [
      {
        id: 'g1',
        name: 'Warden Vance',
        fov: 0.72,
        range: 255,
        route: [
          { x: 445, y: 225 },
          { x: 780, y: 225 },
          { x: 780, y: 395 },
          { x: 585, y: 395 },
        ],
      },
      {
        id: 'g2',
        name: 'Warden Kael',
        fov: 0.70,
        range: 245,
        route: [
          { x: 585, y: 580 },
          { x: 820, y: 580 },
          { x: 820, y: 475 },
          { x: 445, y: 540 },
        ],
      },
      {
        id: 'g3',
        name: 'Vault Sentry',
        fov: 0.68,
        range: 250,
        route: [
          { x: 1090, y: 165 },
          { x: 1090, y: 555 },
          { x: 935, y: 555 },
          { x: 935, y: 165 },
        ],
      },
    ],
  },
  {
    id: 1,
    code: 'WING II',
    name: 'THE GLASS ATRIUM',
    subtitle: 'Translucent Sightlines · Dual Laser Breakers · Smoke Recommended',
    spawn: { x: 116, y: 360 },
    extract: { x: 116, y: 360, label: 'ATRIUM SKYLIGHT DROP' },
    gadgets: { emp: 2, decoy: 3, smoke: 3 },
    roomLabels: [
      { x: 195, y: 102, text: 'WEST FOYER' },
      { x: 650, y: 152, text: 'CRYSTAL PAVILION · GLASS' },
      { x: 1085, y: 102, text: 'SOLARIS SANCTUM' },
    ],
    walls: [
      { x: 24, y: 36, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 662, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 58, w: 22, h: 604, kind: 'wall' },
      { x: 1234, y: 58, w: 22, h: 604, kind: 'wall' },
      // Glass atrium central enclosure (sight passes right through!)
      { x: 425, y: 165, w: 18, h: 170, kind: 'glass' },
      { x: 425, y: 395, w: 18, h: 165, kind: 'glass' },
      { x: 830, y: 165, w: 18, h: 170, kind: 'glass' },
      { x: 830, y: 395, w: 18, h: 165, kind: 'glass' },
      // Solid outer baffles
      { x: 315, y: 58, w: 22, h: 110, kind: 'wall' },
      { x: 315, y: 552, w: 22, h: 110, kind: 'wall' },
      { x: 925, y: 58, w: 22, h: 108, kind: 'wall' },
      { x: 925, y: 554, w: 22, h: 108, kind: 'wall' },
      // Safe cover monoliths
      { x: 215, y: 205, w: 74, h: 78, kind: 'cover' },
      { x: 215, y: 440, w: 74, h: 78, kind: 'cover' },
      { x: 525, y: 245, w: 82, h: 74, kind: 'cover' },
      { x: 675, y: 400, w: 82, h: 74, kind: 'cover' },
      { x: 1015, y: 185, w: 72, h: 74, kind: 'cover' },
      { x: 1015, y: 460, w: 72, h: 74, kind: 'cover' },
    ],
    fuseboxes: [
      { id: 'f1', x: 566, y: 92, label: 'NORTH LASER NODE', targetLaser: 'l1', hacked: false },
      { id: 'f2', x: 566, y: 626, label: 'SOUTH LASER NODE', targetLaser: 'l2', hacked: false },
    ],
    lasers: [
      { id: 'l1', x1: 936, y1: 166, x2: 936, y2: 266, disabledTimer: 0, hackedOff: false },
      { id: 'l2', x1: 936, y1: 454, x2: 936, y2: 554, disabledTimer: 0, hackedOff: false },
    ],
    loots: [
      { id: 'main', x: 1144, y: 360, name: 'SOLARIS DIAMOND BUST', value: 320000, primary: true, stolen: false },
      { id: 'side', x: 640, y: 360, name: 'GILDED ASTROLABE', value: 140000, primary: false, stolen: false },
    ],
    cameras: [
      { id: 'c1', x: 455, y: 74, baseAngle: 1.05, sweepSpan: 0.95, sweepSpeed: 0.85, range: 295, fov: 0.62, phase: 0.0, disabledTimer: 0, suspicion: 0 },
      { id: 'c2', x: 816, y: 642, baseAngle: -1.65, sweepSpan: 0.95, sweepSpeed: 0.92, range: 295, fov: 0.62, phase: 1.9, disabledTimer: 0, suspicion: 0 },
      { id: 'c3', x: 1218, y: 360, baseAngle: Math.PI, sweepSpan: 1.08, sweepSpeed: 0.78, range: 285, fov: 0.65, phase: 0.8, disabledTimer: 0, suspicion: 0 },
    ],
    guards: [
      {
        id: 'g1',
        name: 'Atrium Warden',
        fov: 0.72,
        range: 260,
        route: [
          { x: 375, y: 122 },
          { x: 775, y: 122 },
          { x: 775, y: 245 },
          { x: 375, y: 245 },
        ],
      },
      {
        id: 'g2',
        name: 'Crystal Escort',
        fov: 0.72,
        range: 255,
        route: [
          { x: 775, y: 595 },
          { x: 375, y: 595 },
          { x: 375, y: 475 },
          { x: 775, y: 475 },
        ],
      },
      {
        id: 'g3',
        name: 'Sanctum Captain',
        fov: 0.68,
        range: 245,
        route: [
          { x: 1075, y: 295 },
          { x: 1075, y: 425 },
          { x: 965, y: 425 },
          { x: 965, y: 295 },
        ],
      },
    ],
  },
  {
    id: 2,
    code: 'WING III',
    name: 'THE OBSIDIAN VAULT',
    subtitle: 'Maximum Syndicate Security · 4 Wardens · 3 Cameras · High Haul',
    spawn: { x: 108, y: 360 },
    extract: { x: 108, y: 360, label: 'SUBWAY ESCAPE SHAFT' },
    gadgets: { emp: 3, decoy: 3, smoke: 3 },
    roomLabels: [
      { x: 205, y: 102, text: 'SECURITY CHECKPOINT' },
      { x: 640, y: 152, text: 'DIAMOND LASER CORRIDOR' },
      { x: 1075, y: 102, text: 'OBSIDIAN INNER VAULT' },
    ],
    walls: [
      { x: 24, y: 36, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 662, w: 1232, h: 22, kind: 'wall' },
      { x: 24, y: 58, w: 22, h: 604, kind: 'wall' },
      { x: 1234, y: 58, w: 22, h: 604, kind: 'wall' },
      // Security choke partitions
      { x: 335, y: 58, w: 22, h: 170, kind: 'wall' },
      { x: 335, y: 492, w: 22, h: 170, kind: 'wall' },
      { x: 335, y: 290, w: 18, h: 140, kind: 'glass' },
      // Vault bastion walls
      { x: 895, y: 58, w: 22, h: 165, kind: 'wall' },
      { x: 895, y: 495, w: 22, h: 167, kind: 'wall' },
      { x: 895, y: 295, w: 22, h: 130, kind: 'wall' },
      // Safe cover monoliths
      { x: 198, y: 168, w: 72, h: 74, kind: 'cover' },
      { x: 198, y: 478, w: 72, h: 74, kind: 'cover' },
      { x: 485, y: 210, w: 80, h: 76, kind: 'cover' },
      { x: 485, y: 432, w: 80, h: 76, kind: 'cover' },
      { x: 705, y: 320, w: 86, h: 80, kind: 'cover' },
      { x: 1005, y: 175, w: 72, h: 74, kind: 'cover' },
      { x: 1005, y: 470, w: 72, h: 74, kind: 'cover' },
    ],
    fuseboxes: [
      { id: 'f1', x: 640, y: 92, label: 'UPPER CONDUIT', targetLaser: 'l1', hacked: false },
      { id: 'f2', x: 640, y: 626, label: 'LOWER CONDUIT', targetLaser: 'l2', hacked: false },
    ],
    lasers: [
      { id: 'l1', x1: 906, y1: 223, x2: 906, y2: 295, disabledTimer: 0, hackedOff: false },
      { id: 'l2', x1: 906, y1: 425, x2: 906, y2: 495, disabledTimer: 0, hackedOff: false },
    ],
    loots: [
      { id: 'main', x: 1146, y: 360, name: 'OBSIDIAN SYNDICATE CROWN', value: 400000, primary: true, stolen: false },
      { id: 'side', x: 640, y: 360, name: 'CIPHER LEDGER', value: 140000, primary: false, stolen: false },
    ],
    cameras: [
      { id: 'c1', x: 372, y: 76, baseAngle: 0.85, sweepSpan: 1.0, sweepSpeed: 0.9, range: 285, fov: 0.62, phase: 0.3, disabledTimer: 0, suspicion: 0 },
      { id: 'c2', x: 372, y: 642, baseAngle: -0.85, sweepSpan: 1.0, sweepSpeed: 0.9, range: 285, fov: 0.62, phase: 1.7, disabledTimer: 0, suspicion: 0 },
      { id: 'c3', x: 1218, y: 140, baseAngle: 2.55, sweepSpan: 1.15, sweepSpeed: 0.88, range: 300, fov: 0.64, phase: 0.5, disabledTimer: 0, suspicion: 0 },
    ],
    guards: [
      {
        id: 'g1',
        name: 'Gate Officer',
        fov: 0.72,
        range: 250,
        route: [
          { x: 405, y: 145 },
          { x: 625, y: 145 },
          { x: 625, y: 270 },
          { x: 405, y: 270 },
        ],
      },
      {
        id: 'g2',
        name: 'Laser Patrol',
        fov: 0.72,
        range: 250,
        route: [
          { x: 625, y: 575 },
          { x: 405, y: 575 },
          { x: 405, y: 450 },
          { x: 625, y: 450 },
        ],
      },
      {
        id: 'g3',
        name: 'Center Enforcer',
        fov: 0.74,
        range: 255,
        route: [
          { x: 620, y: 295 },
          { x: 840, y: 295 },
          { x: 840, y: 425 },
          { x: 620, y: 425 },
        ],
      },
      {
        id: 'g4',
        name: 'Vault Marshal',
        fov: 0.70,
        range: 245,
        route: [
          { x: 1125, y: 145 },
          { x: 1125, y: 575 },
          { x: 960, y: 575 },
          { x: 960, y: 145 },
        ],
      },
    ],
  },
];
