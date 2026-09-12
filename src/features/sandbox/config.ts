/** Simulation grid resolution in cells. */
export const GRID_WIDTH = 800;
export const GRID_HEIGHT = 600;

export const BRUSH_MIN = 1;
export const BRUSH_MAX = 80;
export const BRUSH_DEFAULT = 12;

/** Colour of an empty cell. Must match `--background` in globals.css. */
export const BACKGROUND_HEX = '#0b0b0d';

/** Upper bound on how large one cell may render, in CSS px. */
export const MAX_CELL_CSS_PX = 3;

/** How often (ms) the stats HUD re-renders. */
export const STATS_PUBLISH_MS = 250;

/** Heat-view gradient, cold → hot. Also drawn as the legend. */
export const HEAT_STOPS: readonly string[] = ['#101a45', '#1f4fd1', '#28c8dd', '#f7e04a', '#ff5a1f', '#fff4e0'];
