import * as THREE from 'three';

export interface POI {
  position: any; // fallback if no types
  color: number;
  name: string;
  description: string;
}

export interface AppConfig {
  starCount: {
    base: number;
    mobile: number;
  };
  scrollDamping: number;
  maxScrollSpeed: number;
  interactionRadius: {
    max: number;
    min: number;
  };
  mobile: {
    breakpoint: number;
    scrollMultiplier: number;
    hitboxScale: number;
  };
}

export interface AppState {
  cameraY: number;
  selectedPOI: POI | null;
  isMobile: boolean;
  scrollVelocity: number;
  mousePosition: {
    x: number;
    y: number;
  };
  touchFade: number;
}

export interface StateManager {
  get<K extends keyof AppState>(key: K): AppState[K];
  set<K extends keyof AppState>(key: K, value: AppState[K]): void;
  subscribe(callback: () => void): () => void;
}
