/**
 * core/events.ts
 *
 * Minimal, dependency-free, strongly-typed event emitter.
 * Shared by runtime/window.ts and manager/manager.ts.
 */

type Handler<T> = (data: T) => void;

export class Emitter<EventMap extends object> {
  private readonly listeners = new Map<keyof EventMap, Set<Handler<unknown>>>();

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler<unknown>);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    this.listeners.get(event)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    // Copy before iterating: a handler may unsubscribe itself mid-emit.
    for (const handler of [...set]) {
      (handler as Handler<EventMap[K]>)(data);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
