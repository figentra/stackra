# Implementation Plan: gen's staged refusals block everywhere

**Spec**: `.agents/specs/sta-2808-staged-refusals-block/spec.md` · **Linear**: STA-2808 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2808-staged-refusals-block/spec.md`

## Summary

Delete `STAGED_REFUSAL_CODES` and the loop in `generateMember` that downgraded those codes to warnings unless
`options.strict` was true, then remove the `strict` option from `generateMember` and `generate` (which read
`STACKRA_GEN_STRICT`). Remove the repo check that required gen tasks to pass the variable, the variable from the turbo
`env` lists, the flow-preset gate and the runbook, and the warnings loop from the emitted tenant-isolation test.
Update the refusal golden snapshots and ship a breaking changeset with upgrade steps.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/developer/repo-checks` (`tier:lib`);
  `packages/developer/flow-preset` (`tier:lib`, preset data); `apps/docs` (one runbook paragraph)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022) and gen's golden fixtures
- **Storage**: none
- **Runtime target**: build-time tooling (the `stackra gen` CLI and `stackra check`)

## Constitution Check

| Law                                   | Result | Note                                                                |
| ------------------------------------- | ------ | ------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | lib-only edits; no new import                                       |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                          |
| Security                              | PASS   | the write floor, step-up and idempotency now always block           |
| HTTP and events                       | N/A    | no endpoint or event changes                                        |
| Tenancy                               | PASS   | the tenancy migration check now always blocks                       |
| Delegation                            | PASS   | one worktree, one executor                                          |
| Not built yet (ADR 0011)              | PASS   | removes a switch; adds nothing                                      |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside their subjects                         |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                     |
| Deploy modes (ADR 0076)               | PASS   | build-time only, same in all three                                  |
| Licence tier (ADR 0077)               | PASS   | free                                                                |
| Docs and ADRs                         | PASS   | gen README, runbook, changeset; ADRs 0239 and 0347 already say this |

## Deploy modes

| Mode       | Behaviour                                |
| ---------- | ---------------------------------------- |
| SaaS       | same: gen refuses the five at build time |
| On-prem    | same: gen refuses the five at build time |
| Air-gapped | same: gen refuses the five at build time |

## Correctness properties

- **P-001**: for every code in the five and any member IR that trips it, `generateMember(ir)` returns the code in `errors`, never in `warnings`, and `files` is empty — Validates: FR-001
- **P-002**: no source file, turbo `env` list, preset gate step or runbook outside the changelogs names `STACKRA_GEN_STRICT`, and `@stackra/repo-checks` exports no `checkGenStrictEnv` — Validates: FR-002
- **P-003**: every golden refusal entry of a staged code has no `severity` field — Validates: FR-003
- **P-004**: the string `emitIsolationTest` returns contains no `warnings` — Validates: FR-004
- FR-005 is example-only (the changeset text).

## Architecture overview

Gen collects every finding of a pass into one list and splits it by `severity`: a warning prints and never blocks
(STA-340), anything else refuses. Before this change `generateMember` rewrote the five staged codes to
`severity: "warning"` unless `options.strict` was true, and `generate` set `strict` from `STACKRA_GEN_STRICT`. After it,
the check functions' own severity stands: the five are refusals. Nothing else in the split changes.

## Components and responsibilities

- `generateMember` (`@stackra/gen` core): options are `{ pass?: "manifests" | "clients" }`; no downgrade.
- `generate` (`@stackra/gen` node): options lose `strict`; its three inner `generateMember` calls pass only `pass`.
- `emitIsolationTest` (`@stackra/gen` core): emits `await assertRowSecurity(...)` with no warnings loop.
- `configFindings` (`@stackra/repo-checks` node): no `gen-strict-env` phase entry.
- The flow-preset gate: `pnpm gen:check`.

## Files and folders

```text
turbo.jsonc
.changeset/gen-staged-refusals-block.md
apps/docs/src/docs/runbooks/test-infrastructure.mdx
packages/developer/
├── gen/
│   ├── README.md
│   ├── __golden__/
│   │   ├── refusal-endpoint-collision/refusals.json.golden
│   │   └── refusal-reader/refusals.json.golden
│   └── src/
│       ├── core/
│       │   ├── constants/staged-refusal-codes.constant.ts (deleted)
│       │   └── functions/
│       │       ├── generate-member.function.ts
│       │       ├── emit-isolation-test.function.ts
│       │       ├── check-model-scope.function.ts (file contract only)
│       │       └── __tests__/
│       └── node/
│           ├── functions/generate.function.ts
│           └── __tests__/golden.test.ts
├── repo-checks/src/node/
│   ├── index.ts
│   └── functions/
│       ├── check-gen-strict-env.function.ts (deleted, with its test)
│       └── config-findings.function.ts
└── flow-preset/preset/preset.yml
```

## Data models and migrations

none

## Contracts

- `generateMember(authored, previous?, options?: { pass?: "manifests" | "clients" })`: the `strict` option is gone
  (breaking for a direct caller passing it; TypeScript reports the unknown key).
- `generate(root, options?)`: the `strict` option is gone; `STACKRA_GEN_STRICT` is no longer read.
- `@stackra/repo-checks`: `checkGenStrictEnv` is no longer exported; `stackra check` reports no `gen-strict-env`.
- The five refusal codes, their messages and fix lines are unchanged; only their severity is.
- Compatibility: an adopter runs `stackra gen --check` with `STACKRA_GEN_STRICT=1` on 0.19 first; whatever it refuses
  is what this version refuses. A leftover `STACKRA_GEN_STRICT` in a turbo `env` list is harmless and can be removed.

## Error handling

No new refusal and no new message. The five codes now stop the run as every other refusal does: gen prints them,
writes nothing for that pass, and `--check` exits 1.

## Security and tenancy

The change removes an opt-out: the write floor (ADR 0099), step-up (ADR 0406), idempotency (ADR 0136 decision 3) and
the tenancy migration (ADR 0239 decision 1) can no longer pass gen with a warning. No runtime path changes.

## Testing strategy

- AC-001, AC-002: `generate-member.function.test.ts` runs an `it.each` over the five codes on `COMMERCE_IR`
  variants (L1 action, L2 query, L3 action with no step-up, an action with no `idempotency`, an owned model whose only
  migration has no owner column); each asserts the code is in `errors`, not in `warnings`, and `files` is empty. There
  is no option left to make it strict, so the default run is the proof. Revert check: with the downgrade restored, the
  five cases and the emitter test fail (6 failures).
- AC-004: `emit-isolation-test.function.test.ts` asserts the emitted block and `not.toContain("warnings")`.
- AC-005: the repo-checks suite runs without the deleted test; typecheck proves no caller imports the export.
- AC-006: gen's golden test over the updated `refusals.json.golden` files.
- AC-003: `stackra gen --check` across the workspace (115 root members, each service and worker), and
  `pnpm turbo run test typecheck` for gen, repo-checks, flow-preset and cli. An end-to-end run of the built CLI with
  loyalty-kit's `enroll` set to `Permission.L1` and no variable printed `error action_risk_below_write` and exited 1.

## Rollout

Ships with the next release of `@stackra/gen` and `@stackra/repo-checks` (minor, breaking before 1.0) and
`@stackra/flow-preset` (patch). No data or deploy step. The template drops its leftover variable when it moves onto
that release.

## Delegation and risk plan

One executor in one worktree (route `gen`). Risk: an adopter's member trips one of the five and their gen run now
fails; the changeset names the pre-upgrade check. No core member trips one today.

## ADRs

Implements ADR 0099, ADR 0136 (decision 3), ADR 0406 and ADR 0239 (decision 1); fulfils ADR 0239 decision 7 and the
ADR 0347 note (refuse from 0.20). Opens no new ADR.

## Docs

- `packages/developer/gen/README.md`
- `apps/docs/src/docs/runbooks/test-infrastructure.mdx`
- `.changeset/gen-staged-refusals-block.md`

## Complexity tracking

none
