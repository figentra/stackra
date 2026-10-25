---
"@stackra/shortcuts": minor
---

Add `@stackra/shortcuts` (was `@stackra/kbd`), the shortcuts of the programming model v3.1. It ships the
`Shortcut({ keys, group, icon, intents })` kind, which reads a key binding (modifiers and one key, or a chord of steps
separated by spaces) into normal form and refuses a malformed one where the class is declared;
`findShortcutConflicts`, which reports bindings that are the same keys on Apple devices or elsewhere and bindings that
start another's chord; `registerShortcuts`, the generated wiring's call that records each class's derived key and
label and refuses a conflicting batch; and the open `ShortcutContext` with `contributeShortcutContext`, through which
other packages supply what `run(ctx)` receives. `./react` adds `useShortcuts` and `ShortcutItem` for the palette,
`useRunShortcut`, `useShortcut`, the `ShortcutKeys` key hint (`⌘K` on Apple devices, `Ctrl+K` elsewhere, with a spoken
label) and `ShortcutBindings`, which binds every key through TanStack Hotkeys with a 1.5 s chord timeout.
`./testing` adds `runShortcut` and its extension point `registerShortcutTestingPart`.
