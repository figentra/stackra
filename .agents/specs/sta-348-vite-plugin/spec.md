# Feature Specification: `@stackra/vite-plugin` wave 3, the Stackra Vite preset

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/vite-plugin` (developer, wave 3) for real: the `stackra()` preset that serves `#stackra/*`,
wires gen's class-component pass, and builds a member's Vite config from `stackra.config.ts` and gen's options.

## Impact

- **Apps touched**: none (the template's generated `.stackra/vite.config.ts` files consume it)
- **Services touched**: none
- **Packages touched**: `packages/developer/vite-plugin` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none. The Sentry upload token is read by the Sentry plugin from the release job's environment; this
  package never reads or passes one
- **ADR needed**: no (ADR 0261 decision 4, ADR 0295 decision 5, ADR 0305 rule 40; ADR 0127 2026-10-24 note places it
  in developer with the `.` entry)
- **New dependencies**: `vite-plugin-pwa`, `@cloudflare/vite-plugin`, `@react-router/dev` and `@sentry/vite-plugin`
  need catalog entries (owner review); `vite`, `@vitejs/plugin-react` and `@tailwindcss/vite` are in `catalog:frontend`
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/developer/vite-plugin/README.md`, `packages/developer/vite-plugin/AGENTS.md`; ADR 0120, 0127, 0261, 0295, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract; no auth, tenancy, secrets or HTTP)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: gen ships the class-component pass and this package wires it;
  the `.` entry only

## User Scenarios & Testing

### User Story 1 - Generated Vite configs build every web target (Priority: P1)

The template's `apps/console/.stackra/vite.config.ts` and `apps/web/.stackra/vite.config.ts` import `stackra` from
`@stackra/vite-plugin` and call `stackra.viteConfig(app, options)`. The console builds web, PWA and desktop with
per-locale pages, a prerendered offline page and the service worker; the web member renders on Cloudflare Workers
through React Router.

**Independent Test**: `src/core/__tests__/index.test.ts`, `src/core/functions/__tests__/vite-config.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the console's options, **When** `stackra.viteConfig(app, options)` runs with `mode: "pwa"`, **Then** the
   plugins run in order (given, preset, React, pages, manifests, budgets, prerender, PWA, Sentry) and the input holds
   every page and the prerender entry.
2. **Given** `mode: "desktop"`, **Then** the base is `./` and the output folder `dist/renderer`.
3. **Given** the web member with `render: "server"`, **Then** the Workers and React Router plugins replace React and
   no input is set.
4. **Given** a target the app does not declare, a page under an unknown locale or a page path that is not a folder,
   **Then** the call fails before Vite starts.

### User Story 2 - `#stackra/*` and class components in any Vite config (Priority: P1)

A hand-written config uses `plugins: [stackra()]`: `#stackra/<name>` resolves to `.stackra/gen/<name>.ts`, a
component class compiles through gen's pass, and a `.server` import in the browser bundle fails.

**Independent Test**: `src/core/functions/__tests__/{stackra,core-plugins,generated-modules-plugin,server-only-plugin}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `.stackra/gen/wiring.ts`, **When** `#stackra/wiring` is imported, **Then** it resolves to that file; a
   missing module fails with "run `stackra gen`".
2. **Given** a config that already lists `classComponents()`, **Then** the pass runs once.
3. **Given** a client module importing `./orders.server`, **Then** the build fails; the server environment allows it.

### User Story 3 - Build checks and outputs (Priority: P2)

Budgets fail an oversized chunk; pages land at their prefix; manifests are served and emitted at the root; the
prerendered documents are written from the entry's `render`; source maps go to Sentry and are deleted.

**Independent Test**: `src/core/functions/__tests__/{budgets,pages,manifests,prerender,pwa,sentry,render}-plugin(s).function.test.ts`.

## Requirements

- **FR-001**: The member has `package.json` (catalog and workspace versions, the `.` export only), `tsconfig.json`
  (one preset), `turbo.jsonc` (`tier:lib`), `stackra.config.ts` (`definePackage`), README, AGENTS, LICENSE.
- **FR-002**: `stackra` is callable (`stackra(): Plugin[]`) and carries `stackra.viteConfig(app, options)`; it is the
  entry's only value; `ViteConfigOptions` is exported as a type.
- **FR-003**: The class-component pass is gen's `classComponents()`, added once (registry A14).
- **FR-004**: `#stackra/*` resolves to gen's real files and adds no export (ADR 0261).
- **FR-005**: Every option the template's generated configs pass has a real effect (table in the README).
- **FR-006**: No secret is read or passed.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/vite-plugin` exists with the shape it uses
  (`stackra`, `stackra.viteConfig(app, { ... })` with both generated option sets).
- **SC-002**: Every public symbol and internal plugin has a test beside it in `__tests__/`.
- **SC-003**: Tests, typecheck and build pass in the separate testing workflow.

## Known gaps (outside this package)

- The template's console config calls `classComponents({ include: [...] })`; gen's `classComponents()` takes no
  options today (gen owns that signature).
- The template's sample `.stackra/entry/offline.ts` hydrates at import time and exports no `render`; gen's prerender
  entry must follow the contract in the README (STA-339).
- The React Compiler is not enabled: `@vitejs/plugin-react` 6 needs `oxc-transform-react` for it, which is not in a
  catalog.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
