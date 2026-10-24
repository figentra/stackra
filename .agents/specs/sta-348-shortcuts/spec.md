# Feature Specification: `@stackra/shortcuts` wave 3: the Shortcut kind, conflicts, palette, key hints and bindings

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/shortcuts` (experience, wave 3) for real: the `Shortcut({ keys })` kind plus a conflict
detector, the palette list, the key hint, the keyboard bindings and `runShortcut`.

## Impact

- **Apps touched**: none (the template's console uses it, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/experience/shortcuts` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decisions 15, 16, 17, 20, 23 and 25, ADR 0305, ADR 0269, ADR 0245, ADR 0127 2026-10-24
  note)
- **New dependencies**: `@tanstack/hotkeys` (exact beta pin through `catalog:frontend`, owner decision R-66; the
  catalog entry is the owner's edit). `@stackra/contracts`, `@stackra/container` and `@stackra/icons` through
  `workspace:*`; React as an optional peer
- **Deploy modes**: client only; no network
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/shortcuts/README.md`, `packages/experience/shortcuts/AGENTS.md`; ADR 0120, 0127, 0245, 0269, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R1 (input handling only)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- The registry v3.1 row gives the entries `.`, `./react` and `./testing`, and the
  template imports below. ADR 0294 decisions 16, 23 and the package-name row rename `@stackra/kbd` to
  `@stackra/shortcuts` and make palette and key entries Shortcuts. The owner's final review H adds chord sequences with
  a 1.5 s timeout and gen conflict checks; R-66 makes TanStack Hotkeys the web and desktop driver, with display and
  conflict checks ours. The row names `state` as a dependency; nothing here needs it (see Open items).

## User Scenarios & Testing

### User Story 1 - Declare a shortcut (Priority: P1)

An author writes `class OpenPaletteShortcut extends Shortcut({ keys: "mod+k", group }) { run() { ... } }` with its
dependencies in the constructor, or omits `keys` for a palette-only entry.

**Independent Test**: `src/core/bases/__tests__/shortcut.base.test.ts`, `src/core/functions/__tests__/normalize-shortcut-keys.function.test.ts`.

1. **Given** `Shortcut({ keys: "Shift+Mod+L", group })`, **Then** the kind registry records `keys: "mod+shift+l"`,
   `icon: null`, `intents: []`.
2. **Given** `keys: "mod+"`, an unknown modifier, a repeated modifier or `mod+ctrl`, **Then** the declaration throws a
   `RangeError`; an empty `group` throws too.
3. **Given** `keys: "g s"`, **Then** it is a two-step chord.

### User Story 2 - Fail on conflicting keys (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/find-shortcut-conflicts.function.test.ts`, `src/core/functions/__tests__/register-shortcuts.function.test.ts`.

1. **Given** `mod+k` and `meta+k`, **Then** a `same` conflict (they clash on Apple devices); `ctrl+k` and `meta+k` do
   not clash.
2. **Given** `g` and `g s`, **Then** a `prefix` conflict.
3. **Given** a conflicting batch, **Then** `registerShortcuts` throws and registers nothing of it.

### User Story 3 - Palette, buttons and key hints (Priority: P1)

**Independent Test**: the `./react` tests beside `use-shortcuts`, `use-run-shortcut`, `use-shortcut`, `shortcut-keys`.

1. **Given** registered shortcuts, **Then** `useShortcuts()` lists the ones the container binds, in order, as
   `ShortcutItem { type, key, label, group, keys?, icon?, intents? }`.
2. **Given** an item, **Then** `useRunShortcut()(item)` runs the bound instance with the contributed context.
3. **Given** `useShortcut(Class)`, **Then** a stable `() => Promise<void>` usable as `onPress` or `onAction`.
4. **Given** `<ShortcutKeys shortcut={OpenPaletteShortcut} />` on a Mac, **Then** `⌘K` labelled `Command K`; the
   server renders `Ctrl+K`.

### User Story 4 - Keys run shortcuts (Priority: P1)

**Independent Test**: `src/react/shortcut-bindings/__tests__/shortcut-bindings.test.tsx`.

1. **Given** `<ShortcutBindings />` mounted, **Then** each bound shortcut with keys is registered with TanStack Hotkeys
   (`Mod+B`), a chord as a sequence with a 1500 ms timeout, and a press runs it; unmounting unregisters all.

### User Story 5 - Test a shortcut (Priority: P1)

**Independent Test**: `src/testing/functions/__tests__/run-shortcut.function.test.ts`.

1. **Given** `runShortcut(CycleThemeShortcut, { theme: { scheme: "light" } })` and a theming part, **Then** the
   returned `theme.scheme` is `dark`.
2. **Given** a navigation part that records, **Then** `runShortcut(SignOutShortcut)` returns its `navigations`.
3. **Given** a part that builds the instance with its dependencies, **Then** that instance is run and returned.

## Requirements

- **FR-001**: The member files and the entries `.`, `./react` and `./testing`, and no others.
- **FR-002**: (template contract) from `.`: `Shortcut` (called with `{ keys?, group }`, subclasses with constructor
  dependencies and `run()` or `run(ctx)` without `override`) and the `ShortcutContext` type; from `./react`:
  `ShortcutItem` (fields `key`, `label`, `group`, `keys`, `icon` as `IconName`, `intents`), `ShortcutKeys` (`keys` or
  `shortcut`, `className`), `useRunShortcut`, `useShortcut` and `useShortcuts`; from `./testing`: `runShortcut(Class,
input?)` resolving to the context members plus the parts' `stores`, `router`, `navigations`.
- **FR-003**: (registry contract) the conflict detector (`findShortcutConflicts`) and chord sequences with a 1.5 s
  timeout; TanStack Hotkeys never leaves `./react`.
- **FR-004**: `ShortcutContext` and `ShortcutRun` are open for declaration merging; values come from
  `contributeShortcutContext` and `registerShortcutTestingPart`, so this package imports no navigation, theming or
  identity code.

## Success Criteria

- **SC-001**: Every template import resolves (the barrel tests list the exports exactly).
- **SC-002**: Every public symbol has a test beside it; tests run in the separate testing workflow.
- **SC-003**: Format and lint are clean.

## Open items

- `@tanstack/hotkeys` is not in a catalog yet; the owner adds its exact pin to `catalog:frontend`. The driver's key
  spelling (`Control`, `ArrowUp`) follows its docs and is untested against the real package until the testing
  workflow runs.
- The pending-chord hint UI and the "not a command" notice of final review H need the driver's pending-sequence state,
  which its documented API does not expose; not built.
- Filtering palette entries by permission, flag and capability belongs to the generated entries (navigation, intents);
  no option for it exists here yet.
- The row lists `@stackra/state` as a dependency; no code here needs it, so it is not declared (knip would flag it).
- The gen side: `registerShortcuts` in the generated wiring, mounting `ShortcutBindings` in the app entry, a testing
  part that builds shortcuts from the member's wiring, and the theming, navigation and identity packages declaring and
  contributing their `ShortcutContext` members.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
