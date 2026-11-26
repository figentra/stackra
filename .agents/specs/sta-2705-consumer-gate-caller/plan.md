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
- AC-006: actionlint and zizmor, and the run on this pull request with the `consumer-gate` label on 2026-11-26,
  <https://github.com/stackra-inc/stackra/actions/runs/45878145029>: every CI-only step ran (the `--pin` output, the starter checkout at its full
  commit, the move to `RUNNER_TEMP` with the pin check passing, the step summary and the `consumer-gate-scaffold`
  artifact). Its verdict is RED at `install` (`ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC`, STA-2870), the same as box 2, with the same lockfile
  hashes. Testcontainers on `ubuntu-latest` did not run: every step after `install` was skipped.
- Real runs on box 2, both RED:
  - core at this branch (e596df0) with the starter at its committed pin (template main d78a4fa): RED at `install`
    (`ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC`, STA-2870); every later step skipped.
  - core with the STA-2794 PRs and a hand-made starter commit 1c932b5 adding the catalog entries (on no branch or pull
    request): create, service, install, leak, gen, typecheck, lint, build, unit tests and the Postgres integration
    test pass; `format` (STA-2869), `spell` (STA-2870) and `validate` (53 agent-sources findings, STA-2871) fail.
- No run is green at a committed pin yet, so the gate is advisory (Rollout).

## Rollout

Merged as an advisory check that is not required; `runbooks/release.mdx` says red is expected and how to read a red
version pull request. STA-2839 tracks every red step (STA-2869 `format`, STA-2870 `install` and `spell`, STA-2871
`validate`). Once they and STA-2794 merge, a reviewed pull request moves the scaffold pin to a template commit where
one full run is green and links that run; only then does the owner make `Consumer gate (scaffold)` a required check.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the leader approves this plan.

## ADRs

none (ADR 0500 decision 3, ADR 0019, ADR 0525 apply)

## Docs

`runbooks/release.mdx`, the CLI README, the workflows index.

## Complexity tracking

none
