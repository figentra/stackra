# Implementation Plan: stackra dev runs the dev compose of environments.dev.infra

**Spec**: `.agents/specs/sta-2664-dev-infra-compose/spec.md` · **Linear**: STA-2664 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2664-dev-infra-compose/spec.md`

## Summary

`@stackra/runway` gains a pure planner, `devComposeOf`, over a kind table, `DEV_INFRA_KINDS`. `@stackra/cli` writes
the planned Compose files and starts them with `docker compose up --detach --wait` before the member tool, records the
lane and opt-ins, and lays the containers' variables under the dev-secrets values in the member's environment.
`writeDevFacts` writes the infra addresses.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/runway`, `packages/developer/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`; a real-container proof in box 2's `stackra-demo`
- **Storage**: none (generated files under `.stackra/dev/`)
- **Runtime target**: the developer machine (Docker with the compose plugin)

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports runway, as before; runway imports nothing new  |
| Secrets (ADR 0009)                    | PASS   | no credential planned or written; names only in the state file |
| Security                              | PASS   | every port on 127.0.0.1                                        |
| HTTP and events                       | N/A    | none                                                           |
| Tenancy                               | N/A    | dev only                                                       |
| Delegation                            | PASS   | Claude only                                                    |
| Not built yet (ADR 0011)              | PASS   | builds ADR 0199 decision 3, which was planned                  |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                      |
| Versions and catalogs                 | PASS   | changesets: minor for @stackra/runway and @stackra/cli         |
| Deploy modes (ADR 0076)               | PASS   | dev only; deploys unchanged                                    |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                      |
| Docs and ADRs                         | PASS   | the two READMEs and the root runway schema descriptions        |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | unchanged; the dev compose is dev only      |
| On-prem    | unchanged; the on-prem bundle is ADR 0179's |
| Air-gapped | unchanged                                   |

## Correctness properties

- **P-001**: every planned port string is `127.0.0.1:<host>:<container>` with the host port from the runway, moved by
  lane for a per-lane block — Validates: FR-001, FR-002, AC-001, AC-002, AC-003
- **P-002**: a plan with an issue holds no document and no variable — Validates: FR-004, AC-005
- **P-003**: an opt-in block not asked for has a profile and gives no variable — Validates: FR-006
- **P-004**: a member's run never overrides a variable the shell sets, and the dev-secrets file wins over the compose
  — Validates: FR-007, AC-008
- **P-005**: no Docker call happens without a container to start — Validates: FR-005, AC-006

## Architecture overview

`DEV_COMMAND` member mode: `devReady` → `writeDevFacts(root, lane)` → `devInfra` (skip on `--no-infra`, clearing the
state; skip when `TURBO_HASH` is set) → `startDevInfra` → `MEMBER_DEV.run` → `toolCommand` → `runProcess` with
`{ ...tool.env, ...devInfraEnv(cwd), ...devSecretEnv(cwd) }`.
