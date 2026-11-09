# Implementation Plan: a prompt's eval dataset stays .eval.json

**Spec**: `.agents/specs/sta-2663-repo-checks-eval-json/spec.md` · **Linear**: STA-2663 · **Date**: 2026-11-09

**Input**: Feature specification from `.agents/specs/sta-2663-repo-checks-eval-json/spec.md`

## Summary

`MUST_STAY_JSON` gains `(^|/)assets/ai/.+\.eval\.json$`, with the reason: `@stackra/ai` binds a prompt's evaluations
by that fixed asset name. The repository-checks test accepts an eval dataset and still flags another `assets/ai` JSON.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/repo-checks`
- **Testing**: node:test in `src/**/__tests__/`, on CI
- **Storage**: none
- **Runtime target**: the `stackra validate` command

## Constitution Check

| Law                                   | Result | Note                             |
| ------------------------------------- | ------ | -------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import                    |
| Secrets (ADR 0009)                    | N/A    | none                             |
| Security                              | N/A    | none                             |
| HTTP and events                       | N/A    | none                             |
| Tenancy                               | N/A    | none                             |
| Delegation                            | PASS   | Claude only                      |
| Not built yet (ADR 0011)              | N/A    | none                             |
| Test placement (ADR 0022)             | PASS   | the test stays in `__tests__/`   |
| Versions and catalogs                 | PASS   | a changeset patches repo-checks  |
| Deploy modes (ADR 0076)               | N/A    | none                             |
| Licence tier (ADR 0077)               | PASS   | free, MIT                        |
| Docs and ADRs                         | N/A    | the entry carries its own reason |
