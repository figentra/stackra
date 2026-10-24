# AGENTS — @stackra/shortcuts

The `Shortcut` kind, key bindings, the conflict detector, the palette list, the key hint and the keyboard bindings.
Member at `packages/experience/shortcuts` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries
`.`, `./react`, `./testing`.

## Where code goes

| You are writing…               | It goes in…                                    |
| ------------------------------ | ---------------------------------------------- |
| The kind base (`Shortcut`)     | `src/core/bases/shortcut.base.ts`              |
| Key parsing, conflicts, wiring | `src/core/functions/`                          |
| A type                         | `src/core/types/` or beside its React code     |
| React code                     | `src/react/<name>/`                            |
| A test helper                  | `src/testing/functions/`                       |
| A test                         | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- Keys and label keys are derived by gen; never add a `key` or `label` option.
- `run` is not on the kind base (authors would need `override`); runners take `RunnableShortcut`.
- `ShortcutContext` and `ShortcutRun` stay empty here: other packages add members by declaration merging.
- TanStack Hotkeys is imported only in `src/react/shortcut-bindings/`; apps never import it.
- Display (glyphs, spoken form) and conflict checks are ours, not the driver's.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/` or `./testing`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None: bindings, labels and groups are code and i18n keys.
