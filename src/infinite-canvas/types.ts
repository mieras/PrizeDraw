import type * as THREE from "three";

export type MediaItem = {
  url: string;
  width: number;
  height: number;
};

export type PrizeManifestItem = MediaItem & {
  title: string;
  lidwoord: string;
  omschrijvingKort: string;
  omschrijvingFull: string;
  uitslagTitle: string;
  revealValue?: number;
};

export type InfiniteCanvasProps = {
  media: MediaItem[];
  onTextureProgress?: (progress: number) => void;
  interactionMode?: "idle" | "animating" | "revealed";
  animationProgress?: number;
  reducedMotion?: boolean;
  showFps?: boolean;
  showControls?: boolean;
  cameraFov?: number;
  cameraNear?: number;
  cameraFar?: number;
  fogNear?: number;
  fogFar?: number;
  backgroundColor?: string;
  fogColor?: string;
};

export type ChunkData = {
  key: string;
  cx: number;
  cy: number;
  cz: number;
};

export type PlaneData = {
  id: string;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  mediaIndex: number;
};
