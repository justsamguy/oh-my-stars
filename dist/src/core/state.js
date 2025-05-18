class AppStateManager {
    constructor() {
        this.state = {
            cameraY: 0,
            selectedPOI: null,
            isMobile: window.innerWidth <= 600,
            scrollVelocity: 0,
            mousePosition: { x: 0, y: 0 },
            touchFade: 1.0
        };
        this.listeners = new Set();
    }
    get(key) {
        return this.state[key];
    }
    set(key, value) {
        this.state[key] = value;
        this.notify();
    }
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    notify() {
        this.listeners.forEach(cb => cb());
    }
}
export const appState = new AppStateManager();
