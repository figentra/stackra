# Implementation Plan: the consumer gate runs: the scaffold consumer, dated pins and a caller workflow

**Spec**: `.agents/specs/sta-2705-consumer-gate-caller/spec.md` · **Linear**: STA-2705 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2705-consumer-gate-caller/spec.md`

## Summary

The scaffold consumer runs through `stackra create` and `stackra new service` of the core tree's own CLI on packed
tarballs; matrix pins carry a date and `--pin` prints them; a read-only workflow runs the scaffold on the version
packages pull request, a label, pushes to main and dispatch.

## Technical Context

- **Language**: TypeScript (Node 24), YAML (GitHub Actions)
- **Members**: `@stackra/cli`; `tools/consumer-gate` (data); `.github/workflows`
- **Testing**: vitest with a fake executor; real runs on box 2 inside `stackra-demo`
- **Storage**: none (files under `--out` only)
- **Runtime target**: CI (ubuntu-latest) and the testbed

## Constitution Check

| Law                                   | Result | Note                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | a command of `@stackra/cli`; imports no product source                      |
| Secrets (ADR 0009)                    | PASS   | none in files or argv; the turbo scope by name only                         |
| Security                              | PASS   | `contents: read`, `id-token` for the cache decrypt only, SHA-pinned actions |
| HTTP and events                       | N/A    | none                                                                        |
| Tenancy                               | N/A    | no tenant data                                                              |
| Delegation                            | PASS   | Claude only                                                                 |
| Not built yet (ADR 0011)              | PASS   | nothing new: `create`, `new` and the gate exist                             |
| Test placement (ADR 0022)             | PASS   | `src/node/consumer-gate/functions/__tests__/`                               |
| Versions and catalogs                 | PASS   | no catalog change in core                                                   |
| Deploy modes (ADR 0076)               | N/A    | CI tooling                                                                  |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                   |
| Docs and ADRs                         | PASS   | runbook, CLI README, workflows index; spec sta-1813 amended                 |

## Deploy modes

| Mode       | Behaviour |
| ---------- | --------- |
| SaaS       | unchanged |
| On-prem    | unchanged |
| Air-gapped | unchanged |

## Correctness properties

- **P-001**: a scaffold run calls create and new from the core tree's CLI with the tarballs, then copies the fixture and adds the dependencies — Validates: FR-1, AC-001
- **P-002**: a failed create skips the service and every step, exit 1; a bad scaffold setup exits 2 — Validates: FR-1, AC-002, AC-003
- **P-003**: the summary carries the pin's date, age and staleness — Validates: FR-2, AC-004
- **P-004**: `--pin` prints `<repo> <ref>` and never calls the gate — Validates: FR-3, AC-005
- **P-005**: the workflow runs the scaffold on the version packages pull request, read-only, actionlint and zizmor clean — Validates: FR-4, AC-006
- **P-006**: the signatures read gen, oxlint, cspell, oxfmt and validate failure lines — Validates: FR-5, AC-007

## Architecture overview

The command stays the one runner (ADR 0500 decision 3). In pack mode it packs first; a `scaffold` then makes its work
copy with `scaffoldConsumerApp` instead of copying a product checkout, and the shared step plan runs on it. The
workflow only builds core, reads the pin with `--pin`, checks the starter out and calls the command.

## Components and responsibilities

- `scaffoldConsumerApp`: create, new service, fixture and dependencies, as step results.
- `validateConsumerGateSetup`: the scaffold's setup rules.
- `executeConsumerGate`: packs first, then a product copy or a scaffold app, then the plan.
- `consumerGatePinAge` and the summary's pin line.
- `ConsumerGateCommand --pin`.
- `consumerGateSignatures`: the toolchain's failure lines.
- `.github/workflows/consumer-gate.yml`.

Interfaces:

```ts
function scaffoldConsumerApp(
  input: {
    core: string;
    starter: string;
    root: string;
    tarballs: string;
    spec: ConsumerGateProduct;
    logOf: (id: string) => string;
    dryRun?: boolean;
  },
  deps: ConsumerGateDeps,
): ConsumerGateStepResult[];
function consumerGatePinAge(pinned: string | undefined, today: string): ConsumerGatePin;
```

## Files and folders

```text
packages/developer/cli/src/node/commands/consumer-gate.command.ts
packages/developer/cli/src/node/commands/__tests__/consumer-gate.command.test.ts
packages/developer/cli/src/node/consumer-gate/constants/
packages/developer/cli/src/node/consumer-gate/functions/
packages/developer/cli/src/node/consumer-gate/functions/__tests__/
packages/developer/cli/src/node/consumer-gate/types/
packages/developer/cli/README.md
tools/consumer-gate/matrix.yaml
tools/consumer-gate/scaffold-fixture/
.github/workflows/consumer-gate.yml
.github/workflows/README.md
apps/docs/src/docs/runbooks/release.mdx
.agents/specs/sta-1813-product-gate/spec.md
.changeset/consumer-gate-scaffold-runs.md
```

## Data models and migrations

none in core; the fixture's model and migration belong to the throwaway app.

## Contracts

`stackra consumer-gate --pin`; the matrix keys `pinned`, `profile`, `service`, `dependencies`. Existing products and
flags behave as before.

## Error handling

A setup problem exits 2 with its message; a failed scaffold step is a RED summary naming the step's failure lines; the
workflow writes a step summary even when the gate stops at setup.

## Security and tenancy

The workflow holds no write token; the starter is a public repository checked out without credentials; logs carry no
secret. No tenant data.

## Testing strategy

- AC-001 to AC-005, AC-007: vitest with a fake executor (`scaffold-consumer-gate.function.test.ts`,
  `judge-consumer-gate-step.function.test.ts`, `consumer-gate.command.test.ts`).
- AC-006: actionlint and zizmor; the first run on the version packages pull request.
- Real runs on box 2: core main (RED at install, STA-2839) and core with the STA-2794 PRs on a fixed starter (every
  consumer step green).

## Rollout

Merged as a check that is not required. The owner makes `Consumer gate (scaffold)` a required check once STA-2839 is
fixed; until then it reports.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the leader approves this plan.

## ADRs

none (ADR 0500 decision 3, ADR 0019, ADR 0525 apply)

## Docs

`runbooks/release.mdx`, the CLI README, the workflows index.

## Complexity tracking

none
