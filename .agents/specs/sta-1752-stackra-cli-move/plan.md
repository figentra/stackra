# Implementation Plan: the 16 stackra rows of ADR 0500 move into @stackra/cli

**Spec**: `.agents/specs/sta-1752-stackra-cli-move/spec.md` · **Linear**: STA-1752 · **Date**: 2026-11-01

## Summary

1. Cherry-pick `ae232122` onto main `3fa57cd6` and resolve its conflicts: `commands.constant.ts` keeps main's
   `TESTBED_COMMAND` beside the moved commands; the cli and `tools/scripts` READMEs take main's rows plus the move's
   removals; `validate-repository.mjs` is removed.
2. Port main's changes to the moved scripts. Only `validate-repository.mjs` changed since `ae232122`'s parent: it gained
   the session-setting check (`session-settings.mjs`). That check moves into `@stackra/cli`
   (`src/node/session-settings/`) with its test as vitest, and `stackra validate --repository` runs it. Its texts are
   unchanged; its own source spells the forms it reports without their literal text, because the check now scans this
   package too. The repo-checks changes (`MUST_STAY_JSON` rows, ADR numbers) reach the command through the package.
3. Sweep the callers and mentions (docs, rules, AGENTS.md, tenancy). The `.agents/hooks` fixture that names
   `node tools/scripts/validate-repository.mjs` stays as it is until the leader signs off.

This Mac runs nothing heavy; the CLI typecheck and tests, `pnpm validate`, `pnpm format` and `pnpm agents:check` run on
a box (stackra-8a).

## Constitution Check

| Law                                   | Result | Note                                                                                   |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports `@stackra/repo-checks` as a package; no member imports `tools/scripts` |
| Secrets (ADR 0173)                    | N/A    | no secret is read or named; no guarded command is moved                                |
| Security                              | PASS   | the session-setting check keeps both rules and its allow list unchanged                |
| HTTP and events                       | N/A    | no action, endpoint or event                                                           |
| Tenancy                               | PASS   | the ADR 0495 guard moves with its tests and still runs in `pnpm validate`              |
| Delegation                            | PASS   | built by the STA-1752 builder; gated by the tester on a box                            |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology                                                     |
| Test placement (ADR 0022)             | PASS   | every moved test sits in a `__tests__/` folder beside its subject                      |
| Versions and catalogs                 | PASS   | no dependency added                                                                    |
| Deploy modes (ADR 0076)               | PASS   | repository tooling only                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT, as `@stackra/cli`                                                                 |
| Docs and ADRs                         | PASS   | READMEs, rules, AGENTS.md and docs pages name the commands; ADR 0500 stands            |

## Deploy modes

| Mode       | Behaviour                              |
| ---------- | -------------------------------------- |
| SaaS       | unchanged; repository tooling only     |
| On-prem    | unchanged; nothing ships in a bundle   |
| Air-gapped | unchanged; the checks read local files |

## Correctness properties

- **P-001**: `tools/scripts` holds none of the 16 moved scripts, and `stackra --help` lists the moved commands — Validates: FR-001
- **P-002**: each moved test passes in `@stackra/cli` with its cases unchanged — Validates: FR-002
- **P-003**: `stackra validate --repository` on a clean checkout prints nothing and exits 0, and the session-setting test passes with the original messages — Validates: FR-003
- **P-004**: `pnpm validate`, `pnpm new`, `pnpm doctor` and `pnpm eas:preflight` run the CLI, and the baselines are read from `tools/scripts` — Validates: FR-004
- **P-005**: no file outside the ADRs, specs and changelogs names a moved `tools/scripts` file — Validates: FR-005
- **P-006**: the commands test lists `testbed` and the moved commands — Validates: FR-006
