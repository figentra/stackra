# Feature Specification: `@stackra/config` wave 1d, configuration classes and secret references

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/config` (foundation, wave 1d) for real: the `Config({ schema, env })` kind base,
`@Secret("NAME")` resolved blind and never serialised, the fixed layering, public env hydration, `useConfig`, and the
testing module's `.withConfig` and `.withSecrets`.

## Impact

- **Apps touched**: none (the template's apps consume `.` and `./react`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/config` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (configuration is deploy-time, never per tenant; ADR 0146 decision 4)
- **Secrets**: names only. Values are resolved through the `SecretStore` port at boot and never stored enumerable,
  logged, serialised or put in an error (ADR 0173)
- **ADR needed**: no (ADR 0146 as amended by 0294 and 0305; ADR 0294 decisions 19 and 20; ADR 0305 rule 34; ADR 0295
  decisions 2 and 10; ADR 0296 decision 1; ADR 0127 2026-10-24 note for entries)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation` through
  `workspace:*`; `zod` through `catalog:`; React as an optional peer
- **Deploy modes**: same in all; isomorphic core and `./react`, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/config/README.md`, `packages/foundation/config/AGENTS.md`; ADR 0120, 0127, 0146, 0173, 0294, 0295, 0296, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every member boots its configuration through it; a leaked secret or a wrong layer order is a
  security or availability defect everywhere)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: `./env` folds into `.`; `MigrationRunner` moves to
  `@stackra/contracts`; entries `.`, `./react`, `./testing` only; `Config({ schema })` types the schema's fields on the
  class with no `declare` lines

## User Scenarios & Testing

### User Story 1 - Declare a configuration (Priority: P1)

An author writes `class LoyaltyKitConfig extends Config({ schema: LoyaltyKitOptions, env: { ledger: "..." } }) {}` and
injects it by type; a host overrides it with `class LoyaltyKitConfig extends BaseLoyaltyKitConfig { override x = 1 }`.

**Independent Test**: `src/core/bases/__tests__/config.base.test.ts`, `src/core/functions/__tests__/config-key.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Config({ schema })`, **When** a class extends it, **Then** the schema's fields are typed on the class
   without `declare` lines and a new instance holds the schema defaults.
2. **Given** a host override, **When** constructed, **Then** its `override` initializers apply over the defaults; a
   literal-union field (`DriverName<Port>`, an enum) must restate the base type.
3. **Given** an `env` key that is not a schema field, **Then** it is a type error.
4. **Given** the class and its host override in a wiring, **Then** both resolve to the one built instance; the key is
   `configKey(Class, member)` (`loyalty_kit`, `notifications.delivery`), inherited by an override.

### User Story 2 - Boot a configuration (Priority: P1)

`createApp` calls `buildConfig(Class, { env, values, secrets })` and binds the result.

**Independent Test**: `src/core/functions/__tests__/build-config.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the layers, **Then** they apply in order: schema defaults, host override, env map, values; a nested
   object is replaced whole; env strings are coerced to the field's type.
2. **Given** a bad value, **Then** `ConfigInvalidError` names the path and the variable, never the value.
3. **Given** a `@Secret("NAME")` field, **Then** its value comes from `SecretStore` by name, never from env or values,
   and never appears in `JSON.stringify`, `Object.keys`, a spread, `util.inspect` or an error.

### User Story 3 - Hydrate the environment (Priority: P1)

The generated `#stackra/env` calls `hydrateEnv(EnvConfig, import.meta.env, { only: "public" })` in the browser and
`hydrateEnv(EnvConfig, raw)` (with derivations) in the Worker or the console; the Expo config calls `env.str()` etc.

**Independent Test**: `src/core/functions/__tests__/hydrate-env.function.test.ts`,
`src/core/constants/__tests__/env.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** `{ only: "public" }`, **Then** only fields mapped to `VITE_`, `EXPO_PUBLIC_` or `RENDERER_VITE_` variables
   and `isDevelopment` are returned, typed `PublicPart<C> & BuildFacts`; never a server value or a secret.
2. **Given** the whole form, **Then** the validated instance is returned, its secrets resolved from the raw environment
   by name and its derivations applied.
3. **Given** `env.enum(list).default("dev").parse(v, name)`, **Then** an empty string counts as unset and a failure
   names the variable.

### User Story 4 - Read a configuration in a component (Priority: P1)

**Independent Test**: `src/react/config/__tests__/use-config.test.tsx`. `useConfig(SiteConfig)` returns the container's
instance; outside a provider or for an unbound class it throws.

### User Story 5 - Configure a test (Priority: P1)

**Independent Test**: `src/testing/constants/__tests__/config-testing-plugin.constant.test.ts`. Template tests write
`.withConfig(LoyaltyKitConfig, { ledger: "memory" })` and `.withSecrets({ RESEND_WEBHOOK_SECRET: SECRET })`.

## Requirements

- **FR-001**: Entries `.`, `./react`, `./testing` only (registry row 1d, ADR 0127 2026-10-24 note); `./env` folded
  into `.`.
- **FR-002**: `.` exports `Config`, `Secret`, `env`, `hydrateEnv` and the types `BuildFacts`, `PublicPart` (template),
  plus `buildConfig`, `configKey`, `SecretStore`, `ConfigInvalidError` and the option types (registry row).
- **FR-003**: `./react` exports `useConfig`; `./testing` registers `.withConfig` and `.withSecrets` on
  `TestingModuleBuilder` through `registerTestingPlugin` and declaration merging.
- **FR-004**: `Config` is called only; the class is the token; the key is derived by `configKey`.
- **FR-005**: Layers in the order of ADR 0294 decision 19 and ADR 0296 decision 1; validated with the schema's
  generated `X$` (`schemaOf`), frozen.
- **FR-006**: `@Secret` values are resolved blind through `SecretStore` and never serialised; a layer that sets one
  is refused.
- **FR-007**: Runtime dependencies `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `zod` only.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/config` and `@stackra/config/react` exists with the
  shape the template uses: `Config`, `Secret`, `env`, `hydrateEnv`, `BuildFacts`, `PublicPart`, `useConfig`; the
  testing chain `.withConfig(Class, partial)` and `.withSecrets(map)`.
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: A canary secret never reaches any output in the tests.

## Template usages to note

- `hydrateEnv(EnvConfig, raw)` in the Worker resolves secrets from the raw bindings by name, as `apps/web/.stackra/gen/env.ts`
  describes.
- `env.*.parse(value)` in `apps/mobile/.stackra/app.config.ts` passes no name; the error then reads `value`. Gen should
  pass the variable name as the second argument (`parse(process.env.X, "X")`) so the message names it, as that file's
  comments promise.
- `SecretStore` lives in `src/core/ports/`, not `src/contracts/`, because this package has no `./contracts` entry.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
