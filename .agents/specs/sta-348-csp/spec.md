# Feature Specification: `@stackra/csp` wave 2, the Content Security Policy baseline and nonces

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/csp` (security, wave 2) for real: the `CspConfig` configuration, the policy builder, the
header name, per-request nonces, and the React `NonceProvider`, `useNonce` and `Style`.

## Impact

- **Apps touched**: none (the template's web and console apps consume it, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/security/csp` (new member; first member of the `security` category)
- **Cross-service events**: none
- **Tenancy and data**: none (deploy-time origins only)
- **Secrets**: none
- **ADR needed**: no (ADR 0127 and its 2026-10-24 note place `csp` in security; ADR 0294 decisions 15, 19, 20 and 23
  fix the entries, the configuration kind and the Provider meaning; ADR 0237 and 0251 own the edge and desktop
  headers)
- **New dependencies**: none new; `zod` from the default catalog, React from `catalog:frontend`, workspace packages
  through `workspace:*`
- **Deploy modes**: same in all; isomorphic (Workers, Node, browser, Electron main)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/csp/README.md`, `packages/security/csp/AGENTS.md`; ADR 0120, 0127, 0237, 0251, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (a security header: a loosened policy is an XSS exposure, a wrong one breaks every page)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entries `.` and `./react`, depends on config; the consumer
  contract is the template's imports

## User Scenarios & Testing

### User Story 1 - The server sets one policy per response with a fresh nonce (Priority: P1)

The generated web middleware mints `createNonce()`, renders under it, then sets
`response.headers.set(cspHeaderName(csp), contentSecurityPolicy(csp, { connect: [env.apiUrl], nonce }))`.

**Independent Test**: `src/core/functions/__tests__/content-security-policy.function.test.ts`,
`create-nonce.function.test.ts`, `csp-header-name.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the default configuration and no additions, **Then** the policy is exactly the baseline (twelve
   directives, `'self'` scripts and styles, `object-src`, `base-uri` and `frame-ancestors` `'none'`).
2. **Given** a nonce, **Then** `'nonce-<n>'` is added to `script-src` and `style-src` only.
3. **Given** `connect: ["https://api.acme.example/v1"]` and configured `extraConnectSrc`, **Then** `connect-src` is
   `'self'`, the API origin, then the configured origins, each once.
4. **Given** `reportOnly = true`, **Then** the header is `Content-Security-Policy-Report-Only`; otherwise
   `Content-Security-Policy`.
5. Two calls to `createNonce()` never return the same value; each is 16 bytes in base64.

### User Story 2 - A host adds sources without loosening the baseline (Priority: P1)

The template's `src/config/csp.config.ts` imports `CspConfig as BaseCspConfig` and declares `override extraConnectSrc`,
`extraFrameSrc`, `extraImgSrc` (`string[]`) and `reportOnly`; gen wires it under the key `csp`; the document head maps
`csp.extraImgSrc` to preconnects.

**Independent Test**: `src/config/__tests__/csp.config.test.ts`.

**Acceptance Scenarios**:

1. `buildConfig(CspConfig)` holds `[]`, `[]`, `[]`, `false`; `configKey(CspConfig, "csp")` is `csp`.
2. The template's override builds and validates.
3. A source that is a quoted keyword, a bare `*`, empty, or holds whitespace, `;` or `,` fails `buildConfig` with
   `ConfigInvalidError`, and `contentSecurityPolicy` refuses it with a `TypeError`.

### User Story 3 - The render stamps the nonce (Priority: P1)

`entry.server.tsx` wraps the router in `<NonceProvider value={nonce}>`; `root.tsx` passes `useNonce()` to `<Scripts>`
and `<ScrollRestoration>`; the site layout renders `<Style data-brand>{css}</Style>`.

**Independent Test**: `src/react/nonce/__tests__/*.test.tsx`, `src/react/style/__tests__/style.test.tsx`.

**Acceptance Scenarios**:

1. Under a provider, `useNonce()` is its value, the nearest provider winning; outside one it is `undefined` and does
   not throw (the browser after hydration).
2. `Style` renders one `<style>` with the nonce, its attributes and its CSS as text; a `</style>` in the CSS cannot
   close the element; `nonce` and `dangerouslySetInnerHTML` are not props.

### Edge Cases

- A malformed nonce (quote, space, empty): `TypeError`, never a header with an injected source.
- A URL source with a path, query or trailing slash counts by scheme and host; a custom scheme (`app://bundle`)
  keeps its host.
- No nonce (the Electron main): scripts and styles from `'self'` only.

## Requirements

- **FR-001**: The package SHALL be `@stackra/csp` at `packages/security/csp`, `tier:lib`, entries `.` and `./react`
  only (registry row; ADR 0127 2026-10-24 note; ADR 0294 decision 15).
- **FR-002**: `.` SHALL export `CspConfig`, `contentSecurityPolicy`, `createNonce`, `cspHeaderName` and the type
  `CspAdditions`, and no other value (template imports and registry row).
- **FR-003**: `./react` SHALL export `NonceProvider`, `Style`, `useNonce` and the types `NonceProviderProps` and
  `StyleProps`, and no other value.
- **FR-004**: `CspConfig` SHALL be `Config({ schema: CspOptions })` in `src/config/csp.config.ts` with fields
  `extraConnectSrc`, `extraFrameSrc`, `extraImgSrc: string[]` (default `[]`) and `reportOnly: boolean` (default
  `false`), key `csp`, and SHALL ship and register its own `CspOptions$` (ADR 0294 decisions 19, 20 and 26).
- **FR-005**: The policy SHALL be the baseline plus additions to `script-src`, `style-src` (nonce), `connect-src`,
  `frame-src` and `img-src` only; every added source SHALL match one host or scheme source.
- **FR-006**: `createNonce` SHALL use Web Crypto (128 bits, base64) and run on Workers, Node and the browser.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/csp` and `@stackra/csp/react` exists with the shape it
  uses (barrel tests).
- **SC-002**: Every public symbol has a unit test beside it; the suite passes in the testing workflow.
- **SC-003**: No source a host can configure loosens a fixed directive or adds a keyword (baseline and source tests).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
