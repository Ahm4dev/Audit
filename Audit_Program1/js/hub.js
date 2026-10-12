/* Audit-Plus · hub for the few bindings that cannot be plain ES imports:
   - forward references (an earlier module calls a function defined in a later one),
   - values written from another module (SESSION, STORE, …),
   - functions that a later module deliberately overrides (`tabsHTML = function…`).
   The owner module registers live getters/setters with defineHub(); everyone else reads/writes hub.NAME. */
export const hub = Object.create(null);
export function defineHub(map) {
  for (const k in map) {
    const [get, set] = map[k];
    Object.defineProperty(hub, k, { get, set: set || undefined, enumerable: true, configurable: true });
  }
}
