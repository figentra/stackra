# Feature Specification: `@stackra/gen` wave 2, gen-core and the class-component compiler

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/gen` (developer, wave 2) for real: discovery on the TypeScript 7 API with a TypeScript 6
fallback and no ts-morph; derived identities and the committed `stackra.manifest.json` and `openapi.json` with
`stackra gen --check` and `@Renamed`; the shape compiler; the wiring; the member module and the entries; the
class-component compiler (Babel) with its Vite plugin and Metro transformer; and the manifest helpers of
`./testing`. Per-target outputs (clients, routes, panels, tool configs, the Encore app) land with their owning
packages; migration and entity emit waits for the data wave.

## Impact

- **Apps touched**: none (the template's generated Vite and Metro configs import `classComponents()` and the Metro
  transformer; STA-344 wires this repository's apps)
- **Services touched**: none
- **Packages touched**: `packages/developer/gen` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; gen reads source and writes generated files under a member root only
- **Secrets**: none held or read; a config's schema never reaches the manifest or `openapi.json` (ADR 0305 rule 34)
- **ADR needed**: no (ADR 0294 decisions 10, 15 to 17, 20 to 22, 25 and 26; ADR 0295 decisions 1, 5, 7 and 8; ADR 0305
  rules 1 to 19, 28, 34 and 36 to 46; ADR 0127 2026-10-24 note; ADR 0227 2026-10-24 note: build-time wiring from
  constructor types)
- **New dependencies**: `typescript6` (an alias of typescript 6.0.3) needs a `catalog:tooling` entry
  `typescript6: npm:typescript@6.0.3`; everything else is already catalogued (`typescript` 7.0.2 and `@babel/core`
  8.0.7 in `catalog:build`) or `workspace:*`
- **Deploy modes**: build-time tooling only; nothing runs in a deployed member
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/developer/gen/README.md`, `packages/developer/gen/AGENTS.md`; ADR 0120, 0127, 0227, 0294, 0295, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (every member's generated wiring, schemas and locked identities come from here)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 gen row and section 5; ADR 0127 2026-10-24 note: `ir` and `source`
  fold into gen, the allowed entries include the `./metro-transformer` tool hook; A14: gen ships the class-component
  pass and `@stackra/vite-plugin` wires it, so there is no `./vite` entry and `classComponents()` lives in `./node`

## User Scenarios & Testing

### User Story 1 - Identities are derived and locked (Priority: P1)

An author writes `Action({ key: "order.cancel" })` in module `orders`. Gen derives `orders.order.cancel@1`, the
permission `orders.order.cancel` and its risk, `PUT /orders/:orderId/cancel`, the refusal codes and the MCP tool, and
writes them to `stackra.manifest.json`. Renaming the key later fails `stackra gen --check` with `identity_changed`
unless the class carries `@Renamed("order.cancel")`.

**Independent Test**: `src/core/functions/__tests__/build-manifest.function.test.ts`,
`check-identity-lock.function.test.ts`, `generate-member.function.test.ts`, `src/node/functions/__tests__/generate.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the commerce fixture, **Then** every identity of ADR 0294 decision 20 and every route of decision 21 is
   derived, and a config's schema is absent from `schemas`.
2. **Given** two classes deriving one identity, or two overrides of one base, **Then** `identity_collision` or
   `override_duplicate` is reported and no file is written.
3. **Given** a changed key without `@Renamed`, **Then** `identity_changed` fails the run; with `@Renamed(old)` it passes.

### User Story 2 - Shapes compile to zod that the type checker proves (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/emit-schemas.function.test.ts`,
`src/node/functions/__tests__/create-source-reader.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** shape classes, **Then** `#stackra/schemas/<module>` holds one `X$` per enum and shape, one `X$Check` per
   shape, `{ input, output }` per action and query, `.exactOptional()`, the `Date` codec, enums in source order,
   discriminated unions, constant defaults including `Duration.*` and `Money.of`, a member base `.extend`ed and a
   package base reused as `Base<Name>$`, and one `registerSchemas` call (gap G1).
2. **Given** a banned form, **Then** the matching `shape_*`, `action_handle_signature`, `two_declarations_in_file`,
   `partner_mismatch`, `event_base_abstract` or `token_not_a_class` refusal carries a position and a fix.

### User Story 3 - Wiring, member module and entries are generated (Priority: P1)

**Independent Test**: `emit-wiring.function.test.ts`, `emit-member-module.function.test.ts`,
`emit-package-entries.function.test.ts`, `emit-runtime-entries.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a member, **Then** `#stackra/wiring` lists the module graph in dependency order (dependencies marked
   `from`), the platform set, every binding with kind, module, lifetime and constructor tokens (`named(...)` for a
   named instance), the configs with overrides, the driver table with lazy candidates and the `DriverRegistry`
   augmentation keyed by port key, replacements and partners, typed `satisfies Wiring`.
2. **Given** no authored root module, **Then** `#stackra/module` declares `<Key>Module` importing each dependency's
   module from its `node` entry; a package's `node` entry exports it.
3. **Given** a package, **Then** `.stackra/entry/{index,contracts,node,react,native,testing}.ts` re-export their
   folders and shipped schemas with no symbol in two entries; **given** a service, app or worker, **then** each runtime
   entry calls `createApp` with the root module and the wiring.

### User Story 4 - Class components compile to function components (Priority: P2)

**Independent Test**: `class-components-plugin.function.test.ts`, `compile-class-components.function.test.ts`,
`class-components.function.test.ts`, `src/metro-transformer/functions/__tests__/transform.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `class X extends Component<P>` from `#stackra/ui`, **Then** the output is `function X(props: P)` with the
   ADR 0305 rule 38 mapping, React hooks imported, and a source map to the class.
2. **Given** an unsupported form, **Then** Babel fails with a code frame naming the fix.
3. **Given** Vite or Metro, **Then** `classComponents()` and `@stackra/gen/metro-transformer` run the pass before the
   framework's own transforms.

### User Story 5 - Contract tests read the committed contract (Priority: P1)

**Independent Test**: `src/testing/functions/__tests__/*.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's contract tests, **Then** `loadManifest`, `previousRelease`, `expectBackwardCompatible`,
   `loadOpenApi` and `projectOpenApi` behave as they use them (`manifest.events.find(...)`, `event.broadcast?.permission`,
   `expect(await projectOpenApi(next)).toEqual(await loadOpenApi("./openapi.json"))`).
2. **Given** an Explorer conformance test, **Then** `discoverWithGen(FixtureModule, AccessLogged)` lists the
   `Class.method` targets the decorator marks on the module's exports.

## Requirements

- **FR-001**: The member has `package.json` (catalog and workspace versions only), a `tsconfig.json` extending one
  preset, `turbo.jsonc` with `tier:lib`, `stackra.config.ts` (`definePackage({})`), README, and entries `.`, `./node`,
  `./testing` and `./metro-transformer` only (ADR 0127 2026-10-24 note).
- **FR-002**: Discovery reads only the member's own source, sorted by path, through one host seam over
  `typescript/unstable/sync` 7.0.2 with a TypeScript 6.0.3 fallback; a dependency's kinds and identities come from its
  committed manifest, never its `.d.ts` (ADR 0294 decisions 25 and 26; ADR 0305 rules 42 to 45).
- **FR-003**: Identities, the manifest, `openapi.json`, the lock and the backward-compatibility comparison follow ADR
  0294 decisions 20 to 22 and ADR 0305 rules 1, 28, 34 and 36.
- **FR-004**: The shape compiler, wiring, member module and entries follow registry section 5 items 1 to 6 and gap G1.
- **FR-005**: The class-component compiler follows ADR 0305 rules 37 to 41.
- **FR-006**: `./testing` exports exactly the symbols the template imports from `@stackra/gen/testing`.

## Success Criteria

- **SC-001**: Every template import of `@stackra/gen/node`, `@stackra/gen/testing` and `@stackra/gen/metro-transformer`
  resolves with the shape the template uses.
- **SC-002**: Every public symbol has a test beside it (`__tests__/<subject>.test.ts`), run in the testing workflow.
- **SC-003**: Format and lint are clean.

## Out of scope (owned elsewhere)

Clients, routes, navigation, resources and panels, flags, settings, permissions refs, queues, events, extensions, ai,
intents, capabilities, assets, env, i18n keys, `EntitySchema` and migrations, the Encore app, tool configs, icon-name
validation, hooks lint mapped back to the class line, the generated function-type declaration of a class component,
and the snapshot-read lint (registry section 5, "Targets that land with their packages").

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
