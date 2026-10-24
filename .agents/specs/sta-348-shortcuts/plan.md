# Plan: `@stackra/shortcuts` wave 3

**Spec**: `.agents/specs/sta-348-shortcuts/spec.md`

## Design

- `Shortcut` is `createKind("shortcut", ShortcutBase, readShortcutOptions)`, cast so it can only be called.
  `readShortcutOptions` normalises `keys` (`normalizeShortcutKeys`), refuses an empty `group`, and records
  `{ keys | null, group, icon | null, intents }` for `kindOf`. `run` is not on the instance type, so authors write no
  `override`; runners take `RunnableShortcut`.
- Normal form: lower case, modifiers in `MODIFIERS` order (`mod ctrl alt shift meta`), one key from `KEY_NAMES` or a
  single printable character, chord steps separated by one space.
- `findShortcutConflicts` resolves `mod` to `meta` (Apple) and `ctrl` (elsewhere), compares each pair's steps, and
  reports `same` or `prefix` once per pair.
- `registerShortcuts([[Class, key, label]])` (the wiring's call, like `registerStores`) validates key and label forms,
  the kind and `run`, a taken key, then the conflicts over everything registered; all or nothing.
- `ShortcutContext` is an empty open interface. `contributeShortcutContext(part)` adds a function read per run;
  `createShortcutContext` merges the parts.
- `./react`: `useShortcuts` maps `SHORTCUT_ENTRIES` the container binds to `ShortcutItem`; `useShortcut` and
  `useRunShortcut` resolve from `useContainer()` and run with `createShortcutContext()`; `ShortcutKeys` formats with
  `formatShortcutKeys` and `isApplePlatform` read through `useSyncExternalStore` (server snapshot non-Apple);
  `ShortcutBindings` registers TanStack Hotkeys' `getHotkeyManager()` and `getSequenceManager()` (timeout
  `CHORD_TIMEOUT`) in an effect and unregisters on cleanup.
- `./testing`: `runShortcut` calls every registered `ShortcutTestingPart` with `{ type, input }`, takes the first
  instance, merges the context members, passes unclaimed input as given, falls back to `new type()`, runs once and
  returns `{ ...context, shortcut }`. `ShortcutRun` is open for the parts' extra members.

## Constitution check

- Boundaries: runtime imports are `@stackra/contracts`, `@stackra/container`, `@stackra/icons` (types),
  `@tanstack/hotkeys` (only in `src/react/shortcut-bindings/`) and `react` (peer). No app, service, `encore.dev`, and no
  other package's `./testing`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; codes snake_case; the kind is called only; no `kbd`.
- Secrets: none. No parameter properties and no `#private` fields (erasable syntax).
