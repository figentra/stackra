# Implementation Plan: Secret-manager agent and the secrets inbox

**Spec**: `.agents/specs/sta-185-secret-manager-inbox/spec.md` · **Linear**: STA-185 · **Date**: 2026-10-20

## Summary

One script, `tools/scripts/secrets-import.mjs`, streams inbox files into Infisical through the CLI with all output
captured, verifies by hash and audits names only; one agent definition runs it; the hooks keep agents out of the inbox.

## Technical Context

- **Language**: Node 24 ESM scripts
- **Members**: root tooling, `.agents/hooks`, `.opencode/plugins/guard`, `apps/docs`
- **Testing**: node:test in `tools/scripts/__tests__/`, `.agents/hooks/__tests__/`, `.opencode/plugins/guard/__tests__/`
- **Storage**: `~/.stackra/` (audit log, confirm key), outside the repo
- **Runtime target**: developer machine with the Infisical CLI

## Constitution Check

| Law                                   | Result | Note                                           |
| ------------------------------------- | ------ | ---------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | root tooling, no member imports                |
| Secrets (ADR 0009)                    | PASS   | amended by ADR 0257; no value is ever output   |
| Security                              | PASS   | separate security review                       |
| HTTP and events                       | N/A    | no endpoint or event                           |
| Tenancy                               | N/A    | no tenant data                                 |
| Delegation                            | PASS   | builder agent; separate reviewer               |
| Not built yet (ADR 0011)              | PASS   | no rejected technology; no second vault        |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                          |
| Versions and catalogs                 | PASS   | no new dependency                              |
| Deploy modes (ADR 0076)               | N/A    | developer tooling, not deployed                |
| Licence tier (ADR 0077)               | PASS   | MIT                                            |
| Docs and ADRs                         | PASS   | ADR 0257, rule `secrets.md`, runbook `secrets` |

## Deploy modes

| Mode       | Behaviour                               |
| ---------- | --------------------------------------- |
| SaaS       | not deployed; developer-machine tooling |
| On-prem    | not deployed; developer-machine tooling |
| Air-gapped | not deployed; developer-machine tooling |

## Correctness properties

- **P-001**: A valid inbox file is stored, verified and deleted; every refusal keeps it and names a fixed reason — Validates: FR-001
- **P-002**: A random canary value never appears in output, the audit log or the runner's argv — Validates: FR-002
- **P-003**: Dry run writes nothing; production refuses without a valid, unused, matching token, also after a crash — Validates: FR-003
- **P-004**: Hook guards deny inbox paths, globs and home-wide searches and allow ordinary work — Validates: FR-004
- **P-005**: `importSecret` returns only name, ok and reason — Validates: FR-005

## Contracts and events

`pnpm secrets:import` CLI; `importSecret()` for the request page (STA-187).

## Data and tenancy

None.

## Delegation and risk plan

R2: one builder, separate security reviewer, no delegation. One wave.

## ADRs

ADR 0257 (Proposed), amending ADR 0009 rule 3.

## Docs

`apps/docs/src/runbooks/secrets.mdx`, `.agents/rules/secrets.md`, ADR 0257.

## Project structure

`tools/scripts/secrets-import.mjs`, `.agents/agents/secret-manager.md`, `.agents/hooks/{_inbox,guard-bash,guard-paths}.mjs`,
`.opencode/plugins/guard/decide.ts`, `.claude/settings.json`, `apps/docs/src/{adr,runbooks}`.
