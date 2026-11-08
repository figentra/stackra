# Implementation Plan: Call-shape refusals in gen

**Spec**: `.agents/specs/sta-340-call-shape-checks/spec.md` · **Linear**: STA-340 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-340-call-shape-checks/spec.md`

## Summary

A new pure `checkCallShape` in gen reads one action or query's resolved call shape (kind, risk, actors, endpoint, tool
and written options) and returns the refusals `query_above_l1`, `query_precondition`, `action_cache`,
`step_up_missing` and `idempotency_missing`. `buildManifest` calls it once per entry from its action entry block and
reports each refusal through its existing `fail`. The actions pipeline asks `StepUpCheck` only for a user caller (the
owner's answer to Q-001), the three mixed-actor classes declare `stepUp: AssuranceLevel.Aal2`, and every client write
that has no `idempotency` today writes the policy it already has.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` and `packages/application/actions` (`tier:lib`); `packages/security/identity`,
  `packages/security/privacy`, `packages/security/access-log`, `packages/commerce/loyalty-kit`,
  `packages/data/data-maintenance`, `packages/data/media`, `packages/experience/collaboration` (`tier:lib`, fixed
  classes and regenerated manifests); `apps/playground` (`tier:app`, regenerated only)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen goldens through `gen/node/__tests__/golden.test.ts`
- **Storage**: none
- **Runtime target**: a library (the code generator), the action pipeline, and the committed contracts gen writes

## Constitution Check

| Law                                   | Result | Note                                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | gen reads only its IR; actions imports `ActorKind` from contracts, as it does today        |
| Secrets (ADR 0009)                    | N/A    | no secret is named or read                                                                 |
| Security                              | PASS   | every L3/L4 user action must declare step-up; step-up still fails closed for a user caller |
| HTTP and events                       | PASS   | enforces the http-conventions table (query risk, cache, preconditions) and ADR 0136 d3     |
| Tenancy                               | N/A    | no tenant-owned data                                                                       |
| Delegation                            | PASS   | one agent, one worktree; the action entry block is shared with wp-18, merged in order      |
| Not built yet (ADR 0011)              | PASS   | no new technology                                                                          |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside their subjects                                            |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                                            |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                          |
| Licence tier (ADR 0077)               | PASS   | free, this repo                                                                            |
| Docs and ADRs                         | PASS   | rule, gen README, ADR Enforcement lines and the ADR 0406 amendment in the same change      |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | build-time checks; step-up asked of user callers only at runtime |
| On-prem    | same                                                             |
| Air-gapped | same                                                             |

## Correctness properties

- **P-001**: a query with a known risk of L2, L3 or L4 refuses `query_above_l1`; L0, L1 and an unknown permission do
  not — Validates: FR-001, EC-01
- **P-002**: a query with a non-empty `preconditions` refuses `query_precondition`; an action never does — Validates:
  FR-002
- **P-003**: an action with `cache` refuses `action_cache`; a query never does — Validates: FR-003
- **P-004**: an action with risk L3 or L4, `user` among its actors and no `stepUp` refuses `step_up_missing`; without
  `user` it passes — Validates: FR-004, EC-02
- **P-005**: an action with an endpoint or a tool and no written `idempotency` refuses `idempotency_missing`; a written
  value (any of the three) passes, and an action with neither endpoint nor tool passes — Validates: FR-005, EC-03,
  EC-04
- **P-006**: `checkCallShape` is pure and every refusal has a non-empty fix — Validates: FR-006
- **P-007**: for an action with `stepUp`, `StepUpCheck.require` is called iff the caller's kind is `user` — Validates:
  FR-008, EC-05, EC-06
- **P-008**: the golden suite and `stackra gen --check` over every committed manifest pass — Validates: FR-007, FR-009

## Architecture overview

Discovery reads each action or query into the IR. `buildManifest` walks them in its action entry block: it derives the
permission and risk, the actors, the endpoint and whether the class is a tool. Right after the tool decision it hands
those resolved values and the written options to `checkCallShape`, and calls `fail` for each refusal, as it does for
`permission_unknown` and `tool_reason_missing`. Nothing else in gen changes. At runtime, the pipeline's `checked` step
runs the step-up check only when `descriptor.actor.kind` is `ActorKind.User`.

## Components and responsibilities

- `checkCallShape` (new, pure): the five refusals of FR-001 to FR-005, as `{ code, message, fix }`.
- `buildManifest` action entry block: one call per entry; the codes reach the member's refusal list through `fail`
  (FR-006).
- `ActionPipeline.checked`: the step-up condition gains the user-caller test (FR-008).
- The three mixed-actor classes: `stepUp: AssuranceLevel.Aal2` (FR-009).
- The undeclared client writes: an explicit `idempotency` matching today's behaviour (FR-007).

## Files and folders

- `packages/developer/gen/src/core/functions/check-call-shape.function.ts` (new)
- `packages/developer/gen/src/core/functions/__tests__/check-call-shape.function.test.ts` (new)
- `packages/developer/gen/src/core/functions/build-manifest.function.ts` (change: one call in the action entry block)
- `packages/developer/gen/src/core/index.ts` (export `checkCallShape`, as the other checks are)
- `packages/developer/gen/__golden__/**` (only if a golden fixture is refused; fixed in the fixture)
- `packages/application/actions/src/core/services/action-pipeline.service.ts` (change: user callers only)
- `packages/application/actions/src/core/services/__tests__/action-pipeline.service.test.ts` (change: service caller
  passes without `StepUpCheck`, user caller is still asked)
- `packages/security/identity/src/node/actions/bootstrap-operator.action.ts`,
  `packages/security/identity/src/node/actions/end-user-sessions.action.ts`,
  `packages/security/privacy/src/node/actions/release-hold.action.ts` (`stepUp`)
- the action classes `idempotency_missing` refuses in identity, privacy, access-log, loyalty-kit, data-maintenance,
  media and collaboration (`idempotency` written out)
- every committed `stackra.manifest.json` of the members above and `apps/playground` (regenerated)
- `.changeset/sta-340-call-shape-checks.md`
- docs: see Docs

## Data models and migrations

none

## Contracts

- New gen codes: `query_above_l1`, `query_precondition`, `action_cache`, `step_up_missing`, `idempotency_missing`.
- Manifest: the fixed entries gain `idempotency` (and `stepUp` where the manifest records it); nothing is removed.
- Runtime: `Action({ stepUp })` binds user callers only; a service, job, system, agent or anonymous caller is not asked.

## Error handling

Each refusal is a `GenError` with the class's file, the class as subject, the message and the fix (ADR 0294 decision
22), raised through `buildManifest`'s `fail`, so gen writes nothing for a member with a refusal, as today. The runtime
step-up keeps failing closed for a user caller when no `StepUpCheck` is bound (ADR 0406 decision 4).

## Security and tenancy

The step-up rule narrows to user callers by owner decision: a service, job or system call carries no assurance (ADR
0406 decision 1), so asking it could only refuse. An agent call is not asked either; its approvals stay ADR 0360's.
The permission step still runs first, so `identity.operator.bootstrap`'s system permission keeps refusing users before
step-up. User calls to `identity.session.end_user` and `privacy.hold.release` now need a bound `StepUpCheck` (none is
bound in core today): that is the intended fail-closed behaviour, and binding a driver is out of scope. No tenant rule
or secret changes.

## Testing strategy

- AC-001 to AC-005: one fixture per code in `check-call-shape.function.test.ts`, each beside a conforming fixture that
  passes (EC-01 to EC-04), carrying `@covers sta-340:FR-00n`.
- AC-006: the gen golden suite and `stackra gen --check` over every member on ci-box.
- AC-007: two cases in `action-pipeline.service.test.ts` beside the existing step-up cases.
- The identity, privacy and other fixed packages' own tests on ci-box.

## Rollout

One pull request. The changeset bumps `@stackra/gen` and `@stackra/actions` (minor, 0.x: gen refuses classes it
accepted) and patches the packages whose classes gain `stepUp` or `idempotency`. No flag.

## Delegation and risk plan

One agent in `.claude/worktrees/sta-340-call-shape`. Installs, gen, typecheck and tests run on ci-box. The action entry
block of `build-manifest.function.ts` is shared with wp-18 (`figentra/sta-340-endpoint-checks`) and the STA-2044/2045
edits: merge origin/main in before shipping and keep their behaviour. Risk: a user path to the three fixed classes in
an app test without a `StepUpCheck` bound would now fail; the ci-box run of those packages' tests shows it.

## ADRs

ADR 0136 (decision 3), ADR 0207 (decision 1), ADR 0406 (Proposed; amended for decision 3: user callers only), ADR 0294
(decision 22), ADR 0305 (the query cache option). No new ADR.

## Docs

- `.agents/rules/http-conventions.md` (Enforcement) and the AGENTS.md block `tools/scripts/agents-sync.mjs` projects
- `packages/developer/gen/README.md` (gen codes)
- `apps/docs/src/docs/adr/0136-action-runtime-contract.mdx` and
  `apps/docs/src/docs/adr/0207-authentication-assurance-and-machine-identities.mdx` (Enforcement lines)
- `apps/docs/src/docs/adr/0406-step-up-is-an-action-option-checked-after-the-permission-and-the-call-carries-its-assurance.mdx`
  (dated amendment)

## Complexity tracking

none
