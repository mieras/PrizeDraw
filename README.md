# Prize Draw Lottery Demo

_A lottery prize reveal demo on an immersive 3D canvas. Pick and reveal winners in an infinite scroll-style space._

## Features

- **Infinite 3D space** – Navigate through an endless grid; pick and reveal prizes
- **Performance optimized** – Chunk-based rendering with distance-based culling
- **Touch & mouse controls** – Drag to pan, pinch/scroll to zoom
- **Keyboard navigation** – WASD to move, QE for up/down
- **Progressive loading** – Assets load on-demand with progress tracking

## Getting Started

```bash
npm install
npm run dev
```

## Tech Stack

- React 19
- Three.js
- React Three Fiber
- TypeScript
- Vite

## Configuration & tuning

Important constants and defaults live in a few places. Adjust these to change behaviour, performance, and look.

### Infinite canvas (`src/infinite-canvas/constants.ts`)

| Constant | Default | What it does | Higher → | Lower → |
|----------|---------|--------------|----------|---------|
| `CHUNK_SIZE` | 115 | World-unit size of one chunk; grid is based on this. | Larger chunks, coarser grid, fewer chunks | Finer grid, more chunks |
| `RENDER_DISTANCE` | 3 | Chunks within this distance (chunk steps) are fully opaque. | Larger “full visibility” sphere | Only nearby chunks fully visible |
| `CHUNK_FADE_MARGIN` | 1 | Extra chunk distance over which opacity fades 1→0. | Wider fade band, more chunks rendered | Sharper cutoff, fewer chunks |
| `MAX_VELOCITY` | 3.2 | Cap on pan/scroll velocity. | Faster max movement | Slower, more controlled |
| `DEPTH_FADE_START` | 140 | Z-distance where depth-based opacity fade begins. | Items stay solid further away | Fade starts sooner |
| `DEPTH_FADE_END` | 260 | Z-distance where depth fade ends; beyond this chunks are culled. | Visible range extends further, more draw calls | Shorter depth range, better perf |
| `INVIS_THRESHOLD` | 0.01 | Opacity below this = invisible (mesh hidden, update skipped). | Cull sooner (better perf, possible pop) | Render until almost fully transparent |
| `KEYBOARD_SPEED` | 0.18 | WASD movement speed. | Faster | Slower |
| `VELOCITY_LERP` | 0.16 | How quickly velocity follows input. | Snappier | More smoothing/inertia |
| `VELOCITY_DECAY` | 0.9 | Velocity decay per frame (friction). | More glide | Quicker stop |
| `INITIAL_CAMERA_Z` | 47 | Camera Z at start and when idle; also used for animation travel. | Camera further back | Camera closer to content |
| `DRAG_SENSITIVITY` | 0.12 | Pan sensitivity when dragging (world units per pixel). | More movement per pixel | Finer control |

### App (`src/app/index.tsx`)

| Constant | Default | What it does |
|----------|---------|--------------|
| `USE_PRIZES` | `true` | `true` = use prize manifest (CSV-style); `false` = use artworks manifest. |
| `REVEAL_DURATION_MS` | 4000 | Duration of the reveal animation in milliseconds. |
| `POSTAL_CODE_PATTERN` | `/^\d{4}[A-Z]{2}$/` | Validation for Dutch postal code (4 digits + 2 letters). |

### Scene / Canvas (`src/infinite-canvas/scene.tsx`, `InfiniteCanvas` props)

| Prop | Default | What it does |
|------|---------|--------------|
| `cameraFov` | 60 | Camera field of view (degrees). |
| `cameraNear` | 1 | Near clipping plane. |
| `cameraFar` | 500 | Far clipping plane. |
| `fogNear` | 120 | Fog start distance. |
| `fogFar` | 320 | Fog end distance. |
| `backgroundColor` | `"#ffffff"` | Scene background. Use `"transparent"` for no clear. |
| `fogColor` | `"#ffffff"` | Fog colour (usually match background). |

### Chunk / planes (`src/infinite-canvas/utils.ts`)

| Constant | Default | What it does |
|----------|---------|--------------|
| `MAX_PLANE_CACHE` | 256 | Max number of chunk plane configs to cache; eviction is LRU-style. Higher = more memory, fewer recomputes. |

Chunk updates are throttled: `getChunkUpdateThrottleMs(isZooming, zoomSpeed)` returns higher ms when zooming or when zoom speed is high, to avoid jank during fast camera movement.

## Credits

Based on the [Infinite Canvas](https://tympanus.net/codrops/?p=106679) tutorial by [Tympanus Codrops](https://tympanus.net/codrops/).

## License

[MIT](LICENSE)
