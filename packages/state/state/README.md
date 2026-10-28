# @stackra/state

Stackra client state (ADR 0079): local UI state as classes. A store is `class X extends Store({ persist })`, or the
bare `extends Store` for session-only state; its fields are the state, `set` is the only writer and the class's own
methods its only callers, and getters are derived values. Persistence is one option backed by client storage. Signals
hold a single shared value. Server state never lives here: that is `@stackra/query`.

**Tier:** `tier:lib` (`packages/state/state`, ADR 0127 2026-10-24 note). Entries `.`, `./react` and `./testing`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config` and zod; React is an
optional peer of `./react`.

## What is here

| Entry       | Symbol                                     | Use                                                                      |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `.`         | `Store`                                    | `extends Store({ persist: StorageArea.Prefs })` or `extends Store`       |
| `.`         | `StateConfig`, `StateConfig$`              | key `state`: `persistStore`, `blockingHydration`, `devtoolsInProduction` |
| `.`         | `registerStores`                           | the generated wiring's call linking each store class to its key          |
| `.`         | `StoreStorage`, `StoreStorageArea`         | the structural storage contract `@stackra/storage` satisfies             |
| `.`         | `StoreClass`, `StoreOptions`, `StorePatch` | types                                                                    |
| `./react`   | `useStore`                                 | `const ui = useStore(UiStore)` re-renders after every change             |
| `./react`   | `signal`, `useSignal`, `StateSignal`            | one shared reactive value and the hook that reads it                     |
| `./testing` | `createStore`                              | `await createStore(PreferencesStore, { storage })`, hydrated             |
| `./testing` | `mountStore`                               | `const { store, prefs } = mountStore(UiStore)` over memory storage       |

## Declaring a store

```ts
// src/stores/ui.store.ts
export class UiStore extends Store({ persist: StorageArea.Prefs }) {
  sidebarCollapsed = false;

  density: Density = Density.Comfortable;

  toggleSidebar(): void {
    this.set({ sidebarCollapsed: !this.sidebarCollapsed });
  }

  get densityClass(): string {
    return Enum.meta(Density, this.density).className;
  }
}
```

`set` takes the changed fields or a function of the current state (`this.set((s) => ({ ... }))`). A field it does not
know throws; a patch that changes nothing persists nothing and re-renders nothing. The store is a singleton the
container builds with the client storage; read it with `useStore(UiStore)` or inject the class.

## Persistence

The key is derived from the member and the file (`console.ui`), locked in `stackra.manifest.json`, and registered by
the generated wiring through `registerStores`. A persisted store with no registered key refuses to build, so state is
never written under a guessed key. The whole state (the own fields) is written on every change. Hydration runs once,
after the field initializers: a saved field is applied only when the store still declares it with the same type and
`set` has not written it first.

Every persisted store syncs across the tabs of an origin when the runtime has `BroadcastChannel` (there is no option;
native and Node do nothing). On each commit the store posts `{ key, version, state }` on `stackra:state:<area>`; another
context applies it to its instance of the same store with the same validation as hydration, replaces fields it wrote
itself, and notifies subscribers. A context ignores its own posts, another store's key and a message of another version.

## Signals

```ts
const chosen = signal<BillingInterval | null>(null); // one choice shared by the page
const interval = useSignal(chosen);
chosen.set(BillingInterval.Year);
```

## Testing

```ts
const { store, prefs } = mountStore(UiStore);
store.setDensity(Density.Compact);
expect(prefs.get("console.ui")).toMatchObject({ density: "compact" });
```
