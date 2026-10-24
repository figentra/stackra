# Feature Specification: `@stackra/errors` wave 1c, refusals and the error envelope

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/errors` (foundation, wave 1c) for real: the `Refusal({ kind })` kind base, `ErrorKind`, the
core refusals, the ADR 0140 envelope with its kind-to-status map, the `ErrorReporter` port, `useErrorReporter`, and the
`refusal` helper with the `toRefuseWith` matcher. Refusal codes come from one derivation function shared with gen.

## Impact

- **Apps touched**: none (the template's apps consume `.`, `./react`, `./testing`; STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/errors` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (a refusal's details are declared fields; the package stores and logs nothing)
- **Secrets**: none
- **ADR needed**: no (ADR 0140 and 0232 decide the envelope and package; ADR 0294 decisions 16, 20, 25; ADR 0305
  rule 2; ADR 0269 decision 3; ADR 0127 2026-10-24 note for entries)
- **New dependencies**: none new; `@stackra/contracts` and `@stackra/container` through `workspace:*`; React and
  `@stackra/testing` as optional peers
- **Deploy modes**: same in all; isomorphic core, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/errors/README.md`, `packages/foundation/errors/AGENTS.md`; ADR 0120, 0127, 0140, 0232, 0269, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (every member raises and matches refusals through it; a wrong code or category is a contract
  defect on every transport)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: `UnresolvedPortError` stays a plain `Error` in container, so
  errors depends on container and not the reverse; `ErrorReporter` is exported from `./contracts` only; extra entries
  fold into the standard six

## User Scenarios & Testing

### User Story 1 - Declare and raise a refusal (Priority: P1)

An author writes `class OrderNotPayableError extends Refusal({ kind: ErrorKind.Conflict, retryable: false })` with
fields, and raises it with `OrderNotPayableError.create({ orderId, status })`.

**Independent Test**: `src/core/bases/__tests__/refusal.base.test.ts`, `src/core/functions/__tests__/refusal-code.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Refusal`, **When** used bare, **Then** it fails to compile; called with a kind outside `ErrorKind`, it
   throws `RangeError`.
2. **Given** a refusal class, **When** built with `create`, **Then** its code is `snake(class minus "Error")`, its
   category and default retry flag come from the kind, and `create` requires exactly the declared fields.
3. **Given** the template's refusal class names, **When** derived, **Then** the codes equal those its manifests lock.

### User Story 2 - Carry a refusal on the wire (Priority: P1)

Generated adapters, the desktop preload and clients send `refusal.toEnvelope()` or `X.envelope()`.

**Independent Test**: `src/core/bases/__tests__/refusal.base.test.ts`, `src/core/enums/__tests__/error-kind.enum.test.ts`,
`src/core/constants/__tests__/core-refusals.constant.test.ts`.

**Acceptance Scenarios**:

1. **Given** a refusal with details and field errors, **When** enveloped, **Then** the envelope is
   `{ code, category, retryable, details?, fieldErrors?, correlationId?, action? }` with unset members absent.
2. **Given** `ErrorKind`, **When** read with `Enum.meta`, **Then** the statuses are 400, 401, 402, 403, 404, 409, 412,
   429, 503, 500 and `failed_precondition` reports `precondition_failed`.
3. **Given** `CoreRefusals.bridge_rejected.envelope()`, **Then** it is the forbidden envelope with code `bridge_rejected`.

### User Story 3 - Branch on a refusal (Priority: P1)

Routes and hooks write `isRefusal(error)` and `isRefusal(error, ProductNotFoundError)`; the console's error state reads
`refusal.kind` and `refusal.code` and reports anything else with `useErrorReporter()`.

**Independent Test**: `src/core/functions/__tests__/is-refusal.function.test.ts`,
`src/react/error-reporter/__tests__/use-error-reporter.test.tsx`.

**Acceptance Scenarios**:

1. **Given** a refusal from another copy of the package, **When** tested, **Then** `isRefusal` is true (brand, not
   `instanceof`), and a class matches by code.
2. **Given** a container with an `ErrorReporter`, **When** `useErrorReporter()(error)` runs, **Then** the reporter gets
   it; outside a provider or with no reporter bound, the hook throws.

### User Story 4 - Assert a refusal in a test (Priority: P1)

Template tests write `await expect(p).rejects.toRefuseWith(refusal(X))`, `expect(result).toRefuseWith(refusal(X))` and
`refusal(X, { fields: {...} })` for a fake to throw.

**Independent Test**: `src/testing/**/__tests__/*.test.ts`.

## Requirements

- **FR-001**: Entries `.`, `./contracts`, `./react`, `./testing` only (ADR 0294 d15, ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `CoreRefusals`, `ErrorKind`, `ForbiddenError`, `Refusal`, `WorkflowTimedOutError`,
  `isRefusal` (template), and `refusalCode`, the other core refusals and the envelope types (registry row).
- **FR-003**: `./contracts` exports `ErrorReporter` and `.` does not (registry A3).
- **FR-004**: `./react` exports `useErrorReporter`; `./testing` exports `refusal` and `toRefuseWith`.
- **FR-005**: `Refusal` is called only; the code is derived by `refusalCode`, the function gen also uses.
- **FR-006**: `isRefusal` recognises a refusal by a `Symbol.for` brand, not `instanceof`.
- **FR-007**: Runtime dependencies `@stackra/contracts` and `@stackra/container` only.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/errors`, `/contracts`, `/react` and `/testing` exists
  with the shape the template uses, except the exceptions listed below.
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: The ADR 0140 envelope and kind-to-status map are tested.

## Template imports not satisfied here (by design)

- `import type { ErrorReporter } from "@stackra/errors"` in `apps/web/.stackra/context.ts`: one symbol, one entry; the
  sample moves to `./contracts` in STA-344.
- `@stackra/errors/browser` (`SentryErrorReporterDriver`) and `@stackra/errors/native`
  (`SentryNativeErrorReporterDriver`) in the console and mobile gen samples: the Sentry drivers land with the telemetry
  wave and need a catalogued Sentry SDK.
- `ErrorKind.InvalidArgument` in the commerce `pricing` client sample: not one of the ten kinds of ADR 0140; the sample
  should use `ErrorKind.Validation`.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
