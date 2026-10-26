# Feature Specification: actions remainder (effect codes, tool default, reserve-then-commit, audit in the unit of work)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-765

**Clarifications status**: complete

**Input**: Finish `@stackra/actions` after wave 10: the `Effect` enum and an `effects` option, the runtime `tool`
default of gen and ADR 0360 d4, a commit hook that reserves plan limits before the commit, the success audit inside the
unit of work, and an approval step that fails closed.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/actions
- **Cross-service events**: none
- **Tenancy and data**: none (the audit entry's content is unchanged; only when it is written)
- **Secrets**: none
- **ADR needed**: yes, 0397 (Proposed); the 0137 and 0138 amendments are the ADR group's
- **New dependencies**: none (`LimitReservation` is a port; `@stackra/entitlements` implements it)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2 (approval fails closed: every app that runs actions binds a gate)

## Requirements

- **FR-001** `Effect` (snake_case) stays exported from `./contracts`; `ActionOptions.effects: ActionEffects` is checked
  (distinct `Effect` values) and reaches the call descriptor when gen registered none.
- **FR-002** The runtime `tool` default: an action with a user actor is a tool unless `tool: false`.
- **FR-003** `LimitReservation` port; the pipeline runs the unit of work inside `reserve(call, input, commit)`.
- **FR-004** A successful action's audit entry is written inside its unit of work; refusals and replays after.
- **FR-005** No `ApprovalGate` bound fails an action call; `OpenApprovalGateDriver` ships; the testing pipeline uses it
  when a test binds none.

## Not built here

- The entitlements `LimitReservation` driver over `LimitReservationService` (packages/security/entitlements).
- Gen's `EFFECT_TAGS` and tool hints still spell `external-communication`; they move to snake_case in gen.
- Other packages' tests that build an `ActionPipeline` over a bare resolver (iam, entitlements, queue) and the queue
  worker and workflow runner must bind a gate.
- Tests, typecheck and build are written but not run (owner mode).
