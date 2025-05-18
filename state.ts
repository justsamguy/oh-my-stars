import type { AppState, StateManager } from './types.js';

class AppStateManager implements StateManager {
  private state: AppState = {
    cameraY: 0,
    selectedPOI: null,
    isMobile: window.innerWidth <= 600,
    scrollVelocity: 0,
    mousePosition: { x: 0, y: 0 },
    touchFade: 1.0
  };

  private listeners = new Set<() => void>();

  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  set<K extends keyof AppState>(key: K, value: AppState[K]): void {
    this.state[key] = value;
    this.notify();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }
}

export const appState = new AppStateManager();
