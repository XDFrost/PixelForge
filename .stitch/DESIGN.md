# Design System: PixelForge
**Project ID:** local (derived from the reference screenshot; no Stitch project yet)

## 1. Visual Theme & Atmosphere
Utilitarian laboratory console in the dark. Dense but orderly: a narrow instrument
panel on the left, a large black "specimen" viewport on the right, and a thin
telemetry strip underneath. The mood is quiet and technical — matte charcoal
surfaces, hairline borders, tracked uppercase micro-labels numbered like lab
procedures ("01 / ELEMENTS"), and a single warm amber accent that reads as the
"live" state. Nothing glows or floats; the only saturated colour on screen comes
from the simulation itself.

## 2. Color Palette & Roles
- **Void Charcoal (#0b0b0d)** — page ground and the simulation background. Also the colour of an empty cell.
- **Graphite Panel (#141417)** — sidebar, cards, stats strip surfaces.
- **Hairline Slate (#2a2a2e)** — 1 px borders between every panel, swatch and control.
- **Kiln Amber (#e0a040)** — the one accent: selected element card fill, the active Pause button, slider thumb and filled track, logo mark.
- **Warm Paper (#ececec)** — primary text.
- **Ash Grey (#8a8a90)** — secondary text, section micro-labels, key-hint captions.
- **Element swatches** — Water (#4aa3e8), Lava (#f26b1d), Plant (#5cc24a), Obsidian (#5b5474). Shown as 10 px squares beside the element name.

## 3. Typography Rules
- **Display / body:** a neutral geometric sans (Inter or system UI). Element names and button labels at 13 px medium.
- **Micro-labels:** monospace, 10 px, uppercase, letter-spacing ~0.18 em, Ash Grey. Used for section headers ("01 / ELEMENTS", "02 / BRUSH SIZE", "03 / TOOLS"), the viewport title ("EXPERIMENT 001 / FREE PLAY"), resolution ("800 × 600 / LIGHT FROM ABOVE") and the stats strip.
- **Numerics:** monospace with tabular figures so FPS and particle counts do not jitter in width.
- **Logo:** "PIXEL FORGE" in a chunky pixel/bitmap face, amber, with a tiny pixel-cluster mark; tagline "MATTER. MOTION. POSSIBILITY." as a micro-label beneath.

## 4. Component Stylings
* **Element swatch buttons:** 2-column grid. Each is a subtly rounded (6 px) Graphite tile with a Hairline border, a 10 px colour square and the name. Selected state: Kiln Amber fill with dark text. Hover: border lightens one step.
* **Brush slider:** thin Hairline track with the filled portion and round thumb in Kiln Amber; current value ("12 PX") right-aligned as a micro-label, min/max ("1 PX", "80 PX") beneath the ends.
* **Tool buttons:** same tile treatment as swatches, icon + label, 2-column grid (Eraser, Heat view, Bomb, Demo — Phase 1 ships Eraser only).
* **Element info card:** Graphite card, Hairline border; element name in amber-tinted text, one-line description beneath in Ash Grey.
* **Playback buttons:** Pause is a filled amber pill-ish rectangle (6 px radius) with a pause glyph; Step and Clear are outlined Graphite tiles.
* **Stats strip:** single row, monospace micro-text, values in Warm Paper and units in Ash Grey; key hints rendered as tiny `kbd` chips (Hairline border, 3 px radius) followed by their action.
* **Viewport frame:** the canvas sits inside a Hairline-bordered Graphite frame with a title row (title left, playback right) and the stats strip as a footer.

## 5. Layout Principles
- Two columns: fixed ~300 px sidebar, fluid viewport column. Full-height, no page scroll on desktop.
- Sidebar sections separated by 24 px vertical rhythm; each begins with its numbered micro-label.
- 12 px gutters inside panels; 8 px gaps in swatch/tool grids.
- The canvas keeps a 4:3 aspect ratio and scales by integer factors so cells stay crisp (`image-rendering: pixelated`).
- Flat elevation everywhere: no drop shadows, no gradients on chrome. Depth is conveyed by border contrast and the amber accent only.
