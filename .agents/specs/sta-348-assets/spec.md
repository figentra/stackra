# Feature Specification: `@stackra/assets` wave 3, module assets

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/assets` (data, wave 3) for real: the builder the generated `#stackra/assets` calls, the
service that resolves and reads published assets over a filesystem disk, and `useAsset`.

## Impact

- **Apps touched**: none (the template's console, web and commerce `.stackra/gen/assets.ts` call `assets`; the console
  public layout calls `useAsset`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/data/assets` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; shipped, read-only files. Tenant files stay with the files service (ADR 0234 decision 11)
- **Secrets**: none
- **ADR needed**: no (ADR 0234 as amended, 0306, 0261, 0263, 0294 decisions 15 to 17 and 20; ADR 0127 2026-10-24 note)
- **New dependencies**: none outside the workspace and the existing `frontend` catalog (React as an optional peer)
- **Deploy modes**: no network of its own; URLs come from the bound disk
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/assets/README.md`, `packages/data/assets/AGENTS.md`; ADR 0120, 0127, 0234, 0261, 0263, 0294, 0306 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (key and path checks keep an asset path inside its folder)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entries `.` and `./react`, depends on filesystem, template
  imports `.` `assets` and `./react` `useAsset`; ADR 0234 as amended places the package in `data` with `<module>::<path>`
  keys; ADR 0306 moves overrides to the host's `src/overrides/<owner>/` tree, settled by gen. ADR 0234 decision 3 also
  lists `./contracts`, `./node`, `./native` and `./testing`; the registry row and the ADR 0127 2026-10-24 note allow only
  `.` and `./react`, so the service ships from `.` and no other entry is built.

## User Scenarios & Testing

### User Story 1 - Typed asset constants from gen (Priority: P1)

Gen writes `export const Assets = assets({ <module>: { <kind>: { <leaf>: { key, file, overridable } } } })`; code uses
`Assets.orders.public.logo_svg`.

**Independent Test**: `src/core/functions/__tests__/assets.function.test.ts`,
`src/core/functions/__tests__/parse-asset-key.function.test.ts`,
`src/core/functions/__tests__/is-relative-path.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's console, web and commerce gen samples, **Then** `assets` returns them unchanged in value,
   frozen at every level, with each key's literal type.
2. **Given** an entry whose key is not `<module>::<kind>/<path>`, or whose module or kind differs from its place in the
   tree, **Then** `TypeError` naming the entry.
3. **Given** a `file` that is empty, absolute or contains `..`, or an `overridable` that is not a boolean, **Then**
   `TypeError`.

### User Story 2 - Resolve and read published assets (Priority: P1)

A component calls `useAsset(Assets.console.public.logo_svg).url`; a service injects `AssetLibrary` and calls
`text(Assets.orders.ai.explain_order_md)`.

**Independent Test**: `src/core/services/__tests__/asset-library.service.test.ts`,
`src/react/asset/__tests__/use-asset.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a disk with `filesystem.url`, **Then** `resolve` returns `{ key, file, url }` with the URL of
   `<module>/<kind>/<path>`, each segment encoded.
2. **Given** an asset outside `public/`, **Then** `resolve` and `useAsset` throw; **given** a disk with no URL,
   `resolve` throws.
3. **Given** a published file, **Then** `read` returns its bytes and `text` its UTF-8 text; **given** none,
   `FileNotFoundError`.
4. **Given** no `ContainerProvider`, or a container that does not bind `AssetLibrary`, **Then** `useAsset` throws.

## Requirements

- **FR-001**: Entries `.` and `./react` only (registry row, ADR 0127 note).
- **FR-002**: `.` exports `assets` (template) and `AssetLibrary`, with the types `AssetEntry`, `AssetKey`, `AssetTree`,
  `ResolvedAsset`.
- **FR-003**: `./react` exports `useAsset` (template), returning an object with `url`.
- **FR-004**: The runtime addresses an asset by key only; overrides are settled by gen (ADR 0306) and never read at
  runtime.
- **FR-005**: Only `public/` assets get a URL (ADR 0234 decision 6).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/assets` exists with the shape it uses: `assets(tree)`
  called with the gen samples' three-level trees, and `useAsset(entry)` whose result has `.url`.
- **SC-002**: A test beside every public symbol, plus a barrel test per entry, passes in the testing workflow.
- **SC-003**: No test touches the network; a memory disk stands in for the CDN bucket.

## Not in this build

- The Explorer that registers module assets at boot and the dev server (ADR 0234 decision 3, `./node`): gen collects
  assets and the registry row allows no `./node` entry.
- `./native` and `./testing`: not in the registry row; a test binds `AssetLibrary` over a memory disk.
- Content-hashed published paths: the publish step (`stackra build` or CI) owns hashing until gen writes a hash into
  the entry.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
