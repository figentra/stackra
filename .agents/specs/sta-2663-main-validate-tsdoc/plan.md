# Implementation Plan: main's validate is green: the 52 missing or label-only TSDoc blocks

**Spec**: `.agents/specs/sta-2663-main-validate-tsdoc/spec.md` · **Linear**: STA-2663 · **Date**: 2026-11-09

**Input**: Feature specification from `.agents/specs/sta-2663-main-validate-tsdoc/spec.md`

## Summary

Each of the 52 findings gets a TSDoc block, or its label-only block becomes a purpose sentence of at least three
words. Comments only; no code, export or behaviour changes, so no changeset.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: apps/playground, apps/mobile, ai, notifications, database, ui, gen, repo-checks
- **Testing**: `stackra validate --repository` in the Quality Gate
- **Storage**: none
- **Runtime target**: unchanged

## Constitution Check

| Law                                   | Result | Note                         |
| ------------------------------------- | ------ | ---------------------------- |
| Boundaries (tier direction, ADR 0003) | N/A    | comments only                |
| Secrets (ADR 0009)                    | N/A    | none                         |
| Security                              | N/A    | none                         |
| HTTP and events                       | N/A    | none                         |
| Tenancy                               | N/A    | none                         |
| Delegation                            | PASS   | Claude only                  |
| Not built yet (ADR 0011)              | N/A    | none                         |
| Test placement (ADR 0022)             | N/A    | none                         |
| Versions and catalogs                 | N/A    | no changeset: comments only  |
| Deploy modes (ADR 0076)               | N/A    | none                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                    |
| Docs and ADRs                         | PASS   | ADR 0007's docblocks, filled |

## Steps

1. Write each missing block and turn each label into a purpose sentence, from the code it documents.
2. Push; the Quality Gate's validate is the check.
