import { run } from "~/src/utils";

/** World-unit size of one chunk; grid and item positions are based on this. Higher = larger chunks, coarser grid, fewer chunks. Lower = finer grid, more chunks. */
export const CHUNK_SIZE = 105;

/** Chunks within this distance (in chunk steps) from the camera are fully opaque. Higher = larger “full visibility” sphere. Lower = only nearby chunks fully visible. */
export const RENDER_DISTANCE = 3;

/** Extra chunk distance over which opacity fades from 1 to 0. Chunks between RENDER_DISTANCE and RENDER_DISTANCE + CHUNK_FADE_MARGIN fade out. Higher = wider fade band, more chunks rendered. Lower = sharper cutoff, fewer chunks. */
export const CHUNK_FADE_MARGIN = 1;

/** Cap on pan/scroll velocity (e.g. for drag). Higher = faster max movement. Lower = slower, more controlled. */
export const MAX_VELOCITY = 3.2;

/** Depth (Z distance from camera) where depth-based opacity fade starts. Closer than this = full opacity. Higher = items stay solid further away. Lower = fade starts sooner. */
export const DEPTH_FADE_START = 90;

/** Depth where depth fade ends (fully transparent). Chunks beyond this (+ margin) are culled. Higher = visible range extends further, more draw calls. Lower = shorter depth range, better performance. */
export const DEPTH_FADE_END = 260;

/** Opacity below this is treated as invisible (mesh hidden, update skipped). Higher = cull sooner (better perf, possible pop). Lower = render until almost fully transparent. */
export const INVIS_THRESHOLD = 0.04;

/** Movement speed for keyboard (WASD). Higher = faster. Lower = slower. */
export const KEYBOARD_SPEED = 0.18;

/** How quickly velocity follows input (lerp factor). Higher = snappier response. Lower = more smoothing/inertia. */
export const VELOCITY_LERP = 0.16;

/** Velocity decay per frame (friction). Higher (e.g. 0.95) = more glide. Lower (e.g. 0.8) = quicker stop. */
export const VELOCITY_DECAY = 0.96;

/** Camera Z at start and when idle. Also used for animation travel (e.g. INITIAL_CAMERA_Z - 420). Higher = camera further back. Lower = camera closer to content. */
export const INITIAL_CAMERA_Z = 43;

/** Pan sensitivity when dragging (world units per pixel). Higher = more movement per pixel. Lower = finer control. */
export const DRAG_SENSITIVITY = 0.12;

export type ChunkOffset = {
  dx: number;
  dy: number;
  dz: number;
  dist: number;
};

export const CHUNK_OFFSETS: ChunkOffset[] = run(() => {
  const maxDist = RENDER_DISTANCE + CHUNK_FADE_MARGIN;
  const offsets: ChunkOffset[] = [];
  for (let dx = -maxDist; dx <= maxDist; dx++) {
    for (let dy = -maxDist; dy <= maxDist; dy++) {
      for (let dz = -maxDist; dz <= maxDist; dz++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
        if (dist > maxDist) continue;
        offsets.push({ dx, dy, dz, dist });
      }
    }
  }
  return offsets;
});
