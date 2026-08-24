import type { RunEvent, RunEventType } from './types.js';

type Listener = (event: RunEvent) => void;

export class TypedEventBus {
  private readonly listeners = new Map<string, Set<Listener>>();

  on(event: RunEventType, fn: Listener): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
  }

  off(event: RunEventType, fn: Listener): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(fn);
    }
  }

  emit(event: RunEvent): void {
    const set = this.listeners.get(event.type);
    if (set) {
      for (const fn of set) {
        fn(event);
      }
    }
  }

  once(event: RunEventType, fn: Listener): void {
    const wrapper: Listener = (e) => {
      this.off(event, wrapper);
      fn(e);
    };
    this.on(event, wrapper);
  }
}

export const eventBus = new TypedEventBus();
