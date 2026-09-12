# PixelForge

A 2D cellular-automata physics sandbox in the browser. Every pixel of an 800 × 600 grid is one
element; elements fall, flow, grow and react with each other every tick.

**Phase 3 (current):** 14 paintable elements — Water, Lava, Plant, Fire, Steam, Smoke, Obsidian, Sand, Stone, Wood, Oil, Acid, Ice, Gunpowder — plus hidden Ember, Fuse, Burning wood, Burning oil and Glass.
Heat is a real field: it diffuses through solids and liquids, and elements change phase by temperature.

| Interaction | Result |
|---|---|
| Lava touches water | Lava becomes obsidian and the water flashes to steam; the chilled obsidian keeps solidifying lava for a few cells, forming a crust about six cells deep |
| Lava dropped on water | Sinks (denser), crusting at the interface |
| Water heated above 100° | Boils into steam |
| Steam | Rises through everything, cools 1°/tick, condenses back to water below 60° |
| Fire touches plant, or plant heated above 160° | Plant becomes a glowing ember |
| Ember | Throws flames and smoke upward, creeps through the bush, spreads heat, then leaves a puff of smoke |
| Water touches fire | Fire is snuffed into steam |
| Plant next to water | Plant drinks the water cell and grows into it; slow upward growth without water |
| Sand | Falls, piles at 45°, sinks through water; fuses to glass at extreme heat |
| Wood + fire or lava | Burns for seconds as a slow ember, spreading to neighbours |
| Oil | Floats on water; a lit slick keeps floating while it burns off |
| Acid | Sinks in water, dissolves plant, wood, sand, stone and gunpowder; each bite may spend the acid. Obsidian and glass are immune |
| Ice | Freezes a bounded sheet into adjacent still water; melts near heat |
| Gunpowder + flame | Lights a fuse that races along the trail and blasts: empty cells catch fire, sand/plant/wood/stone blow into smoke, water flashes to steam, obsidian survives |
| Heat view (`H`) | Renders every cell by temperature on a cold → hot gradient |

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest unit tests (engine, elements, renderer, geometry)
npm run lint       # ESLint incl. feature-boundary rules
npm run build      # tsc -b && vite build
```

Requires Node 20.19+ or 22.x. Vite is pinned to v6 because Vite 7/8 need Node ≥ 22.12.

## Controls

| Input | Action |
|---|---|
| Drag | Paint the selected element |
| Right-click / Alt-drag | Erase |
| Shift-drag | Replace whatever is under the brush |
| `Space` | Pause / resume |
| `.` | Step one tick (pauses) |
| `[` / `]` | Brush size |
| `1`–`9` | Select element |
| `E` | Toggle eraser |
| `H` | Toggle heat view |
| `C` | Clear |

## Architecture

Feature-based layout under `src/`:

```
app/                 App shell and global styles
shared/              ui (shadcn), lib (rng, geometry, colour), hooks
features/
  simulation/        Engine: SoA grid, tick loop, liquid/powder/gas/reaction/heat/transition kernels, blast helper, command queue. No React.
  elements/          Element definitions (data + optional update hook), reaction table, ids.
  renderer/          Palette, heat LUT + ImageData blitter.
  brush/             Pointer painting, keyboard shortcuts, brush-size control.
  palette/           Element picker + info card.
  controls/          Pause / Step / Clear, tools panel.
  stats/             Low-rate stats HUD.
  sandbox/           Composition root: store, engine instance, canvas view, page layout.
```

Dependency rules are enforced in `eslint.config.js`: the engine layers never import React or UI
features, `simulation` never imports concrete elements (the compiled registry is injected), and
UI features talk to the engine only through `EngineContext`.

### Adding an element

1. Add a stable id to `features/elements/ids.ts` (append only).
2. Create `features/elements/defs/<name>.ts` with an `ElementDef` (colours, behaviour, density, optional `update`).
3. Register it in `features/elements/index.ts` and add any contact reactions to `reactions.ts`.
4. Add a description in `features/palette/copy.ts`.

## Design

`.stitch/DESIGN.md` is the visual source of truth (palette, typography, component styling).

## Roadmap

- **Phase 4** Chunked "awake" regions, Web Worker + OffscreenCanvas.
- **Phase 5** Bomb tool, demo scenes, stress test, save/load.
