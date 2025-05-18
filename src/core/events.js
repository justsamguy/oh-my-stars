// Simple event bus (converted from TS)
export class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }
  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }
  emit(event, data) {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}
export const events = new EventBus();
