# Feature Specification: `@stackra/feature-flags` wave 2: the Flag kind, refs, reader and providers

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/feature-flags` (state, wave 2) for real: the `Flag({ expires, removalIssue, default,
scopes })` kind, the `FlagProvider` port with its `config` and `posthog` drivers, the reader, the configuration with
its shipped schema, `useFlag` and `fakeFlags`.

## Impact

- **Apps touched**: none. The template's web and mobile apps override `FeatureFlagsConfig` and read flags (STA-344)
- **Services touched**: none
- **Packages touched**: `packages/state/feature-flags` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables. The reader sends ids only: a subject and a tenant id (ADR 0071)
- **Secrets**: none. The PostHog project key is public
- **ADR needed**: no (ADR 0213, 0294 decisions 4, 16, 19, 20, 25 and 26, 0307 decision 25, 0305, 0269, and the ADR
  0127 2026-10-24 note)
- **New dependencies**: none new. `@stackra/contracts`, `@stackra/container`, `@stackra/validation` and
  `@stackra/config` come through `workspace:*`; `zod` through `catalog:`; and `react` through `catalog:frontend` as an
  optional peer
- **Deploy modes**: the `config` driver makes no outbound call (safe for air-gapped installs); `posthog` calls the
  configured host
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/feature-flags/README.md`, `packages/state/feature-flags/AGENTS.md`; ADR 0071, 0120, 0127, 0213, 0269, 0294, 0305, 0307 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (no flag changes a price or a right; a provider outage keeps the last values or the defaults)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- The registry v3.1 row gives the entries `.`, `./contracts`, `./react` and
  `./testing`, and the dependency on config. ADR 0307 decision 25 adds `scopes`, which default to Platform and Tenant.
  ADR 0213 decision 3 as amended by 0294 says a flag is a kind of its own, not a settings kind, with native and PostHog
  drivers. The template's mobile gen sample imports `PosthogFlagProviderDriver` from a `./native` entry, which the
  registry row does not list. That entry is not built, and the driver ships from `.` (see Open items).

## User Scenarios & Testing

### User Story 1 - Declare a flag and name it by a typed ref (Priority: P1)

An author writes `class HelpCentreFlag extends Flag({ default: false }) {}`. Gen writes
`flagRefs({ web: { help_centre: HelpCentreFlag } })`, and code names `Flags.web.help_centre`.

**Independent Test**: `src/core/bases/__tests__/flag.base.test.ts`, `src/core/functions/__tests__/flag-refs.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Flag({ default: false })`, **Then** the kind registry records `{ default: false, expires: null,
removalIssue: null, scopes: ["platform", "tenant"] }`.
2. **Given** `expires: "2027-02-30"` or `scopes: []`, **Then** the declaration throws a `RangeError`.
3. **Given** the web tree, **Then** `Flags.web.help_centre` is `{ key: "web.help_centre", label:
"web::flags.help_centre.label", ... }`, frozen, typed `FlagRef<"web.help_centre">`.
4. **Given** the mobile tree's written-out `orders.quick_order`, **Then** its fields are kept and the missing ones take
   the defaults.

### User Story 2 - Read a flag in a component (Priority: P1)

`useFlag(Flags.web.pricing_yearly_first)` returns the provider's value, or the declared default.

**Independent Test**: `src/react/flag/__tests__/use-flag.test.tsx`, `src/core/services/__tests__/flag-reader.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** no load yet, **Then** the default is rendered; **given** a load, **Then** the provider's value is rendered.
2. **Given** `targeting: "visitor"` and a `null` visitor id, **Then** the provider is asked for a `null` subject.
3. **Given** a failed load, **Then** the last values stay; **given** two overlapping loads, **Then** only the newest is
   applied.
4. **Given** `watch`, **Then** values refresh every `refreshEvery` until stopped.

### User Story 3 - Choose the provider by configuration (Priority: P1)

**Independent Test**: `src/config/__tests__/feature-flags.config.test.ts` and the two driver tests.

**Acceptance Scenarios**:

1. **Given** the web and mobile overrides of the template, **Then** they build, keyed `feature_flags`.
2. **Given** a value key `help` (not `<module>.<name>`), **Then** `buildConfig` throws `ConfigInvalidError`.
3. **Given** `posthog` and a `null` subject, **Then** no request is sent and `{}` is returned.
4. **Given** PostHog's `web-help_centre: { enabled: true }`, **Then** the driver returns `{ "web.help_centre": true }`.

### User Story 4 - Set flags in a test (Priority: P2)

**Independent Test**: `src/testing/__tests__/flags.fake.test.ts`, `src/testing/functions/__tests__/fake-flags.function.test.ts`.

1. **Given** `fakeFlags((fake) => fake.set(ref, true))`, **Then** the returned `FlagsFake` is a `FlagReader` whose
   `get(ref)` is `true`, and `useFlag` reads it when it is bound in place of `FlagReader`.

## Requirements

- **FR-001**: The member files and the entries `.`, `./contracts`, `./react` and `./testing`, and no others.
- **FR-002**: (template contract) every symbol the template imports exists with the shape it uses. From `.`: `Flag`,
  `FeatureFlagsConfig`, `FlagTargeting`, `flagRefs`, and the gen samples' `ConfigFlagProviderDriver` and
  `PosthogFlagProviderDriver`. From `./contracts`: `FlagProvider`, typed so `DriverName<FlagProvider>` is
  `"config" | "posthog"`. From `./react`: `useFlag`. From `./testing`: `fakeFlags`.
- **FR-003**: (registry contract) `.` also exports `FeatureFlagsConfig$`, the shipped schema, and `FlagReader`.
- **FR-004**: `FeatureFlagsConfig` fields: `provider`, `values`, `targeting`, `refreshEvery` (the mobile override),
  `posthogKey` (fed by the template's env `featureFlagsPosthogKey`) and `posthogHost`.
- **FR-005**: No identifier leaves the process for an anonymous caller.

## Success Criteria

- **SC-001**: Every template import resolves (the barrel tests list the exports exactly).
- **SC-002**: Every public symbol has a test beside it; tests run in the separate testing workflow.
- **SC-003**: Format and lint are clean.

## Open items

- The mobile gen sample imports `PosthogFlagProviderDriver` from `@stackra/feature-flags/native`. The registry has no
  `./native` entry, and the driver uses plain `fetch`, which React Native provides. Gen should import it from `.`
  (template conversion STA-344).
- The template's `render(..., { flags })` option belongs to `@stackra/testing/react`, which is not built yet. It should
  bind the given `FlagsFake` in place of `FlagReader`.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
