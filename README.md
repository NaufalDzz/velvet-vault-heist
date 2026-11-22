# velvet-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/NaufalDzz/velvet-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/NaufalDzz/velvet-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Velvet Vault: The Glass Syndicate** is an original offline Art Deco tactical heist game running cleanly from static ES modules with zero network requests.

## Features
- **3 Multi-Route Syndicate Wings**: *The Amber Gallery*, *The Glass Atrium* (vision passes through translucent glass walls), and *The Obsidian Vault*.
- **Raycasted Vision Cones & Acoustic Stealth**: Guard patrol cones and swiveling security cameras clip dynamically against solid walls, safe obsidian cover monoliths, and active smoke clouds.
- **Tactical Gadgets at Real Cost**:
  - `[1]` **EMP Pulse** — Battery-limited shockwave disabling nearby cameras and laser tripwires for 6s.
  - `[2]` **Brass Decoy** — Limited coin chimes that lure patrolling guards off-route to investigate.
  - `[3]` **Smoke Veil** — Opaque mist canisters that physically slice enemy sightlines for 5s.
- **Readable Tension & Fair Outcomes**: Live segmented Alarm Meter (`CALM` → `CAUTION` → `HIGH ALERT` → `LOCKDOWN`), `IN COVER` shelter ring, fusebox bypass routes, optional high-value side loot, fair caught debrief, and ranked getaway summary (`S` / `A` / `B`).
- **Procedural Web Audio Synth**: Responsive noir bass pulse, EMP discharge, decoy chimes, and klaxon cues (`[M]` to mute).

## Controls
| Key / Input | Action |
| :--- | :--- |
| `W A S D` / Arrows | Move thief |
| `Shift` (hold) | Sprint (faster movement, emits audible footstep ring) |
| `1` | Trigger **EMP Pulse** |
| `2` / Mouse Click | Throw **Brass Decoy** toward cursor |
| `3` | Deploy **Smoke Veil** |
| `E` | Hack Fusebox, lift Loot, or Extract at hatch |
| `R` | Instant Retry current wing |
| `M` | Mute / unmute procedural audio |

## Module Structure
- `game/index.html` & `game/styles.css` — Offline Art Deco shell and non-blocking HUD
- `game/src/constants.js` — World geometry dimensions, palette tokens, gadget & detection tuning
- `game/src/levels.js` — 3 handcrafted multi-route wing layouts, glass partitions, laser circuits, and patrols
- `game/src/vision.js` — Exact 2D raycasted visibility polygon solver & line-of-sight math
- `game/src/stealth-ai.js` — Guard patrol/suspicion/alert AI, camera sweeps, cover detection, and alarm meter
- `game/src/gadgets.js` — EMP Pulse, Brass Decoy, Smoke Veil, and terminal/loot/extraction interactions
- `game/src/audio.js` — Zero-dependency Web Audio API procedural sound synthesizer
- `game/src/engine.js` — Deterministic fixed-timestep simulation, collision physics, rank grading, and `?shot=` staging
- `game/src/renderer.js` — Art Deco terrazzo/brass Canvas 2D renderer with multi-stop cones & character rigs
- `game/src/hud.js` — Live HUD Alarm Meter, gadget dock, and Caught/Getaway overlay binder
- `game/src/main.js` — Bootstrapping, responsive HiDPI loop, keyboard/mouse input, and automated test bridge

## Run it

```sh
node serve.ts
```

Then open `http://localhost:8080` in desktop Chrome. To build the deterministic submission dossier locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License
MIT

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
