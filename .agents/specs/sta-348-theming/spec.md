# Feature Specification: `@stackra/theming` wave 3, the colour scheme and the look over `@stackra/tokens`

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/theming` (state, wave 3) for real: colour mode and the theme configuration over
`@stackra/tokens` themes.

## Impact

- **Apps touched**: none (the template's console, web and mobile apps are the consumers)
- **Services touched**: none
- **Packages touched**: `packages/state/theming` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; the chosen scheme is a device preference in the client `prefs` area
- **Secrets**: none
- **ADR needed**: no (ADR 0060, 0079, 0256, 0294, 0302, 0127 note)
- **New dependencies**: none new to the catalogs; `@stackra/contracts`, `@stackra/container`, `@stackra/config`,
  `@stackra/validation`, `@stackra/storage`, `@stackra/tokens`, `@stackra/ui`, `@stackra/assets` through
  `workspace:*`; `zod` through `catalog:`; React and React Native as optional peers
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/theming/README.md`, `packages/state/theming/AGENTS.md`; ADR 0060, 0077, 0079, 0120, 0127, 0256, 0294, 0302 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R1 (client preference only)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.`, `./react`, `./native`; `.` exports `ColorScheme`,
  `ThemingConfig`, `ThemingConfig$`, `./react` exports `useColorScheme`; Q6: one `ColorScheme`, declared in
  `@stackra/ui/contracts` and used by theming; ADR 0127 2026-10-24 note: category `state`, allowed entries

## User Scenarios & Testing

### User Story 1 - An app sets its look (Priority: P1)

An app overrides `ThemingConfig` with `override` members (theme, logo, schemes, default scheme, theme colour, splash,
self-hosted fonts, tenant override); gen extends `ThemingConfig$` field by field.

**Independent Test**: `src/config/__tests__/theming.config.test.ts`.

**Acceptance Scenarios**:

1. **Given** no override, **Then** the configuration is the `stackra` theme, no logo, every scheme, `system` first and
   the theme's background as theme and splash colour.
2. **Given** the template's console, web and mobile overrides (an asset entry or key as logo, a merged splash),
   **Then** each builds; a bad theme name, logo, scheme list or colour fails with `ConfigInvalidError`.
3. **Given** a host's generated `ThemingConfig$.extend({ x: shape.x.unwrap().default(...) })`, **Then** its parse
   equals the built override.

### User Story 2 - A user picks a colour scheme (Priority: P1)

A toggle or settings page calls `useColorScheme()` and `setScheme(scheme)`; the choice is kept on the device and
`resolved` follows the system while the choice is `system`.

**Independent Test**: `src/core/services/__tests__/color-scheme.service.test.ts`,
`src/react/color-scheme/__tests__/use-color-scheme.test.tsx`.

**Acceptance Scenarios**:

1. **When** `setScheme("dark")` runs, **Then** `prefs` holds `theming.scheme = "dark"` and a new service reads it.
2. **Given** the choice is `system`, **When** the system preference changes, **Then** subscribers are notified and
   `resolved` follows.
3. **Given** a scheme the configuration does not offer, **Then** `setScheme` throws `RangeError` and stores nothing; a
   stored one reads as the default.
4. **Given** a server render, **Then** the hook shows the default scheme with `system` as light.

### User Story 3 - Each runtime reports its system preference (Priority: P2)

**Independent Test**: the three driver tests.

1. `memory` starts light and changes on `set`; `browser` reads `prefers-color-scheme: dark`; `appearance` reads
   `Appearance.getColorScheme()`; each forwards changes until unsubscribed.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./browser`, `./react`, `./native`, `./testing` only (ADR 0127 2026-10-24
  note); one symbol per entry; `./contracts` imports no other entry.
- **FR-002**: `.` exports `ColorScheme` (re-exported from `@stackra/ui/contracts`, not declared), `ThemingConfig`,
  `ThemingConfig$`, `ThemingOptions`, `ColorSchemeService`, `MemorySystemColorSchemeDriver` and the types
  `ColorSchemeState`, `SchemeColors`, `Splash`.
- **FR-003**: `./react` exports `useColorScheme(): { scheme, resolved, setScheme }`, platform-free so the native app
  imports it from `./react` too.
- **FR-004**: The choice lives in the `prefs` area of `@stackra/storage` under `theming.scheme`, read on every access.
- **FR-005**: The package never writes to the DOM or `Appearance`; `@stackra/ui`'s `DesignSystemProvider` applies the
  scheme.
- **FR-006**: The package ships `theming::enums.color_scheme.*` labels in English and Arabic.

## Success Criteria

- **SC-001** (template imports): `ColorScheme` (`.Light`, `.Dark`, `.System`, `Enum.values`), `ThemingConfig` (as
  `BaseThemingConfig` with `theme`, `logo`, `schemes`, `defaultScheme`, `themeColor`, `splash`, `selfHostedFonts`,
  `tenantOverride`; `useConfig`; constructor injection), `ThemingConfig$` (`.shape.<field>.unwrap().default(...)`,
  `.shape.splash.parse(undefined)`) from `.`; `useColorScheme` (`scheme`, `resolved`, `setScheme`) from `./react`.
- **SC-002** (registry contract): colour mode and theme provider over `@stackra/tokens` themes; depends on tokens and
  storage.
- **SC-003**: every public symbol has a test beside it; the barrel tests pin each entry's exports.
- **SC-004**: format and lint pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- A `ColorScheme` built with `Enum.of`: it is `@stackra/ui`'s (Q6, design-system session). Until it changes, the
  template's `ColorScheme.Light` and `Enum.values(ColorScheme)` do not type-check against the frozen tuple.
- Writing `data-theme` or `Appearance` from this package, and a theme provider component: `@stackra/ui` applies the
  scheme and gen mounts it.
- A `@stackra/state` dependency: its `Store` opens areas through `area(name)`, which `@stackra/storage`'s `Storage`
  does not have, and `useSignal` takes no server snapshot; the service uses `Storage` directly.
- A cookie so the server knows the device's choice before hydration.
- Per-tenant brand at runtime (Pro, ADR 0077); `tenantOverride` only gates a site's colours.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
