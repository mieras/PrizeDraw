import { Stats, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";
import { useIsTouchDevice } from "~/src/use-is-touch-device";
import { clamp, lerp } from "~/src/utils";
import {
  CHUNK_FADE_MARGIN,
  CHUNK_OFFSETS,
  CHUNK_SIZE,
  DEPTH_FADE_END,
  DEPTH_FADE_START,
  DRAG_SENSITIVITY,
  INITIAL_CAMERA_Z,
  INVIS_THRESHOLD,
  RENDER_DISTANCE,
} from "./constants";
import styles from "./style.module.css";
import { getTexture } from "./texture-manager";
import type { ChunkData, InfiniteCanvasProps, MediaItem, PlaneData } from "./types";
import { generateChunkPlanesCached, getChunkUpdateThrottleMs, shouldThrottleUpdate } from "./utils";

const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1);

type CameraGridState = {
  cx: number;
  cy: number;
  cz: number;
  camZ: number;
};

function MediaPlane({
  position,
  scale,
  media,
  chunkCx,
  chunkCy,
  chunkCz,
  cameraGridRef,
}: {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  media: MediaItem;
  chunkCx: number;
  chunkCy: number;
  chunkCz: number;
  cameraGridRef: React.RefObject<CameraGridState>;
}) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const localState = React.useRef({ opacity: 0, frame: 0, ready: false });

  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  useFrame(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    const state = localState.current;

    if (!material || !mesh) {
      return;
    }

    state.frame = (state.frame + 1) & 1;

    if (state.opacity < INVIS_THRESHOLD && !mesh.visible && state.frame === 0) {
      return;
    }

    const cam = cameraGridRef.current;
    const dist = Math.max(Math.abs(chunkCx - cam.cx), Math.abs(chunkCy - cam.cy), Math.abs(chunkCz - cam.cz));
    const absDepth = Math.abs(position.z - cam.camZ);

    if (absDepth > DEPTH_FADE_END + 50) {
      state.opacity = 0;
      material.opacity = 0;
      material.depthWrite = false;
      mesh.visible = false;
      return;
    }

    const gridFade =
      dist <= RENDER_DISTANCE ? 1 : Math.max(0, 1 - (dist - RENDER_DISTANCE) / Math.max(CHUNK_FADE_MARGIN, 0.0001));

    const depthFade =
      absDepth <= DEPTH_FADE_START
        ? 1
        : Math.max(0, 1 - (absDepth - DEPTH_FADE_START) / Math.max(DEPTH_FADE_END - DEPTH_FADE_START, 0.0001));

    const target = Math.min(gridFade, depthFade * depthFade);

    state.opacity = target < INVIS_THRESHOLD && state.opacity < INVIS_THRESHOLD ? 0 : lerp(state.opacity, target, 0.18);

    const isFullyOpaque = state.opacity > 0.99;
    material.opacity = isFullyOpaque ? 1 : state.opacity;
    material.depthWrite = isFullyOpaque;
    mesh.visible = state.opacity > INVIS_THRESHOLD;
  });

  // Calculate display scale from media dimensions (from manifest)
  const displayScale = React.useMemo(() => {
    if (media.width && media.height) {
      const aspect = media.width / media.height;
      return new THREE.Vector3(scale.y * aspect, scale.y, 1);
    }

    return scale;
  }, [media.width, media.height, scale]);

  // Load texture with onLoad callback
  React.useEffect(() => {
    const state = localState.current;
    state.ready = false;
    state.opacity = 0;
    setIsReady(false);

    const material = materialRef.current;

    if (material) {
      material.opacity = 0;
      material.depthWrite = false;
      material.map = null;
    }

    const tex = getTexture(media, () => {
      state.ready = true;
      setIsReady(true);
    });

    setTexture(tex);
  }, [media]);

  // Apply texture when ready
  React.useEffect(() => {
    const material = materialRef.current;
    const mesh = meshRef.current;
    const state = localState.current;

    if (!material || !mesh || !texture || !isReady || !state.ready) {
      return;
    }

    material.map = texture;
    material.opacity = state.opacity;
    material.depthWrite = state.opacity >= 1;
    mesh.scale.copy(displayScale);
  }, [displayScale, texture, isReady]);

  if (!texture || !isReady) {
    return null;
  }

  return (
    <mesh ref={meshRef} position={position} scale={displayScale} visible={false} geometry={PLANE_GEOMETRY}>
      <meshBasicMaterial ref={materialRef} transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Chunk({
  cx,
  cy,
  cz,
  media,
  cameraGridRef,
}: {
  cx: number;
  cy: number;
  cz: number;
  media: MediaItem[];
  cameraGridRef: React.RefObject<CameraGridState>;
}) {
  const [planes, setPlanes] = React.useState<PlaneData[] | null>(null);

  React.useEffect(() => {
    let canceled = false;
    const run = () => !canceled && setPlanes(generateChunkPlanesCached(cx, cy, cz));

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run, { timeout: 100 });

      return () => {
        canceled = true;
        cancelIdleCallback(id);
      };
    }

    const id = setTimeout(run, 0);
    return () => {
      canceled = true;
      clearTimeout(id);
    };
  }, [cx, cy, cz]);

  if (!planes) {
    return null;
  }

  return (
    <group>
      {planes.map((plane) => {
        const mediaItem = media[plane.mediaIndex % media.length];

        if (!mediaItem) {
          return null;
        }

        return (
          <MediaPlane
            key={plane.id}
            position={plane.position}
            scale={plane.scale}
            media={mediaItem}
            chunkCx={cx}
            chunkCy={cy}
            chunkCz={cz}
            cameraGridRef={cameraGridRef}
          />
        );
      })}
    </group>
  );
}

type ControllerState = {
  basePos: { x: number; y: number; z: number };
  drift: { x: number; y: number };
  mouse: { x: number; y: number };
  lastChunkKey: string;
  lastChunkUpdate: number;
  pendingChunk: { cx: number; cy: number; cz: number } | null;
  isDragging: boolean;
  lastDragClient: { x: number; y: number };
};

const createInitialState = (camZ: number): ControllerState => ({
  basePos: { x: 0, y: 0, z: camZ },
  drift: { x: 0, y: 0 },
  mouse: { x: 0, y: 0 },
  lastChunkKey: "",
  lastChunkUpdate: 0,
  pendingChunk: null,
  isDragging: false,
  lastDragClient: { x: 0, y: 0 },
});

const easeInOutCubic = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

function SceneController({
  media,
  onTextureProgress,
  interactionMode,
  animationProgress,
  focusMediaIndex,
}: {
  media: MediaItem[];
  onTextureProgress?: (progress: number) => void;
  interactionMode: "idle" | "animating" | "revealed";
  animationProgress: number;
  focusMediaIndex: number | null;
}) {
  const { camera, gl } = useThree();
  const isTouchDevice = useIsTouchDevice();

  const state = React.useRef<ControllerState>(createInitialState(INITIAL_CAMERA_Z));
  const cameraGridRef = React.useRef<CameraGridState>({ cx: 0, cy: 0, cz: 0, camZ: camera.position.z });
  const animationStartRef = React.useRef<{ x: number; y: number; z: number } | null>(null);

  const [chunks, setChunks] = React.useState<ChunkData[]>([]);

  const { progress } = useProgress();
  const maxProgress = React.useRef(0);

  React.useEffect(() => {
    const rounded = Math.round(progress);

    if (rounded > maxProgress.current) {
      maxProgress.current = rounded;
      onTextureProgress?.(rounded);
    }
  }, [progress, onTextureProgress]);

  React.useEffect(() => {
    const canvas = gl.domElement;
    const s = state.current;

    const setCursor = (cursor: string) => {
      canvas.style.cursor = cursor;
    };

    const onMouseLeave = () => {
      s.mouse = { x: 0, y: 0 };
      if (s.isDragging) {
        s.isDragging = false;
        setCursor("grab");
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      s.mouse = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || interactionMode !== "idle") return;
      s.isDragging = true;
      s.lastDragClient = { x: e.clientX, y: e.clientY };
      setCursor("grabbing");
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (s.isDragging && e.buttons === 0) {
        s.isDragging = false;
        setCursor("grab");
        canvas.releasePointerCapture(e.pointerId);
        return;
      }
      if (s.isDragging) {
        e.preventDefault();
        const dx = e.clientX - s.lastDragClient.x;
        const dy = e.clientY - s.lastDragClient.y;
        s.basePos.x += dx * DRAG_SENSITIVITY;
        s.basePos.y -= dy * DRAG_SENSITIVITY;
        s.lastDragClient = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (s.isDragging) {
        s.isDragging = false;
        setCursor("grab");
        canvas.releasePointerCapture(e.pointerId);
      }
    };

    if (interactionMode !== "idle") {
      s.isDragging = false;
    }
    setCursor(interactionMode === "idle" ? "grab" : "default");
    window.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    const pointerOpts = { passive: false };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove, pointerOpts);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gl, interactionMode]);

  React.useEffect(() => {
    if (interactionMode !== "animating") {
      animationStartRef.current = null;
    }
  }, [interactionMode]);

  useFrame(() => {
    const s = state.current;
    const now = performance.now();
    const focusSeed = ((focusMediaIndex ?? 0) % 17) / 17;
    const parallaxStrength = isTouchDevice ? 0 : 2.6;

    if (interactionMode === "idle") {
      s.basePos.z = lerp(s.basePos.z, INITIAL_CAMERA_Z, 0.08);
      s.drift.x = lerp(s.drift.x, s.mouse.x * parallaxStrength, 0.12);
      s.drift.y = lerp(s.drift.y, s.mouse.y * parallaxStrength, 0.12);
    } else if (interactionMode === "animating") {
      if (animationStartRef.current === null) {
        animationStartRef.current = {
          x: s.basePos.x + s.drift.x,
          y: s.basePos.y + s.drift.y,
          z: s.basePos.z,
        };
      }

      const eased = easeInOutCubic(clamp(animationProgress, 0, 1));
      const travelZ = INITIAL_CAMERA_Z - 420;
      const travelX = Math.sin(eased * Math.PI * 2 + focusSeed * Math.PI * 2) * 5.5;
      const travelY = Math.cos(eased * Math.PI * 2 + focusSeed * Math.PI) * 4.5;

      const start = animationStartRef.current;
      s.basePos.x = lerp(start.x, travelX, eased);
      s.basePos.y = lerp(start.y, travelY, eased);
      s.basePos.z = lerp(start.z, travelZ, eased);
      s.drift.x = lerp(s.drift.x, s.mouse.x * 1.1, 0.12);
      s.drift.y = lerp(s.drift.y, s.mouse.y * 1.1, 0.12);
    } else {
      s.basePos.x = lerp(s.basePos.x, 0, 0.06);
      s.basePos.y = lerp(s.basePos.y, 0, 0.06);
      s.basePos.z = lerp(s.basePos.z, INITIAL_CAMERA_Z - 420, 0.06);
      s.drift.x = lerp(s.drift.x, 0, 0.1);
      s.drift.y = lerp(s.drift.y, 0, 0.1);
    }

    camera.position.set(s.basePos.x + s.drift.x, s.basePos.y + s.drift.y, s.basePos.z);

    const cx = Math.floor(s.basePos.x / CHUNK_SIZE);
    const cy = Math.floor(s.basePos.y / CHUNK_SIZE);
    const cz = Math.floor(s.basePos.z / CHUNK_SIZE);

    cameraGridRef.current = { cx, cy, cz, camZ: s.basePos.z };

    const key = `${cx},${cy},${cz}`;
    if (key !== s.lastChunkKey) {
      s.pendingChunk = { cx, cy, cz };
      s.lastChunkKey = key;
    }

    const isZooming = interactionMode === "animating";
    const throttleMs = getChunkUpdateThrottleMs(isZooming, Math.abs(s.basePos.z - INITIAL_CAMERA_Z) * 0.02);

    if (s.pendingChunk && shouldThrottleUpdate(s.lastChunkUpdate, throttleMs, now)) {
      const { cx: ucx, cy: ucy, cz: ucz } = s.pendingChunk;
      s.pendingChunk = null;
      s.lastChunkUpdate = now;

      setChunks(
        CHUNK_OFFSETS.map((o) => ({
          key: `${ucx + o.dx},${ucy + o.dy},${ucz + o.dz}`,
          cx: ucx + o.dx,
          cy: ucy + o.dy,
          cz: ucz + o.dz,
        }))
      );
    }
  });

  React.useEffect(() => {
    const s = state.current;
    s.basePos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };

    setChunks(
      CHUNK_OFFSETS.map((o) => ({
        key: `${o.dx},${o.dy},${o.dz}`,
        cx: o.dx,
        cy: o.dy,
        cz: o.dz,
      }))
    );
  }, [camera]);

  return (
    <>
      {chunks.map((chunk) => (
        <Chunk key={chunk.key} cx={chunk.cx} cy={chunk.cy} cz={chunk.cz} media={media} cameraGridRef={cameraGridRef} />
      ))}
    </>
  );
}

export function InfiniteCanvasScene({
  media,
  onTextureProgress,
  interactionMode = "idle",
  animationProgress = 0,
  focusMediaIndex = null,
  showFps = false,
  showControls = false,
  cameraFov = 60,
  cameraNear = 1,
  cameraFar = 500,
  fogNear = 120,
  fogFar = 320,
  backgroundColor = "#ffffff",
  fogColor = "#ffffff",
}: InfiniteCanvasProps) {
  const isTouchDevice = useIsTouchDevice();
  const dpr = Math.min(window.devicePixelRatio || 1, isTouchDevice ? 1.25 : 1.5);

  if (!media.length) {
    return null;
  }

  const isTransparent = backgroundColor === "transparent";

  return (
    <div className={styles.container}>
      <Canvas
        camera={{ position: [0, 0, INITIAL_CAMERA_Z], fov: cameraFov, near: cameraNear, far: cameraFar }}
        dpr={dpr}
        flat
        gl={{ antialias: false, powerPreference: "high-performance", alpha: isTransparent }}
        className={isTransparent ? `${styles.canvas} ${styles.canvasTransparent}` : styles.canvas}
      >
        {!isTransparent && <color attach="background" args={[backgroundColor]} />}
        <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
        <SceneController
          media={media}
          onTextureProgress={onTextureProgress}
          interactionMode={interactionMode}
          animationProgress={animationProgress}
          focusMediaIndex={focusMediaIndex}
        />
        {showFps && <Stats className={styles.stats} />}
      </Canvas>

      {showControls && (
        <div className={styles.controlsPanel}>{isTouchDevice ? <>Beweeg om te kijken</> : <>Beweeg muis voor parallax</>}</div>
      )}
    </div>
  );
}
