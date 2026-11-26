# Implementation Plan: the ADR index, the number register and customer citations match the ADR pages

**Spec**: `.agents/specs/sta-2851-adr-index-health/spec.md` · **Linear**: STA-2851 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2851-adr-index-health/spec.md`

## Summary

Two pure checks join `checkAdrNumbers` in the config phase of `stackra check`. `checkAdrIndex` holds every ADR page to
one index row with its link and status, and the register to the page's status. `checkCustomerAdrLinks` keeps customer
pages from citing a superseded or rejected ADR. The data on main is corrected so the phase passes: seven index rows
added, 0067's row and register status, six stale reservations, 0531 moved out as `external`, and three customer
citations.

## Technical Context

- **Language**: TypeScript (ESM); MDX and YAML data
- **Members**: `packages/developer/repo-checks`, `apps/docs`
- **Testing**: vitest unit tests in `src/node/functions/__tests__/`; `stackra check --only config` on the branch and on
  main's data
- **Storage**: none
- **Runtime target**: `stackra check` (CLI, CI Quality Gate)

## Constitution Check

| Law                                   | Result | Note                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | repo-checks imports only `yaml` and its own files        |
| Secrets (ADR 0009)                    | PASS   | none read or written                                     |
| Security                              | PASS   | no runtime code                                          |
| HTTP and events                       | N/A    | none                                                     |
| Tenancy                               | N/A    | none                                                     |
| Delegation                            | PASS   | Claude only                                              |
| Not built yet (ADR 0011)              | N/A    | none                                                     |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                    |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/repo-checks`             |
| Deploy modes (ADR 0076)               | N/A    | a repository check                                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                |
| Docs and ADRs                         | PASS   | ADR template, index contract, register header, customers |

## Deploy modes

| Mode       | Behaviour                           |
| ---------- | ----------------------------------- |
| SaaS       | not applicable: a repository check  |
| On-prem    | not applicable: a repository check  |
| Air-gapped | not applicable: reads only the repo |

## Correctness properties

- **P-001**: on main's data before this change the config phase reports exactly the audit's drift (19 findings) —
  Validates: AC-001, AC-002, AC-003, AC-004
- **P-002**: on the branch the config phase reports none — Validates: AC-006
- **P-003**: a repository with no ADR pages, like the template, is not checked — Validates: AC-005

## Architecture overview

`configFindings` reads the ADR pages and customer pages once (`TextFile[]`) and the index and register texts, then
calls `checkAdrIndex(docs, index, register)` (rule `adr-index`) and `checkCustomerAdrLinks(docs)` (rule
`customer-adr-links`). Both read a page's status with `descriptionOf` (frontmatter) and `adrStatusOf` (leading word
and superseding number).

## Components and responsibilities

- `checkAdrIndex`: index rows against pages; register statuses against pages.
- `checkCustomerAdrLinks`: customer-page links against page statuses.
- `adrStatusOf`, `descriptionOf`: shared readers.
- `ADR_PAGE_PATH` (also read by `checkAdrNumbers`), `ADR_INDEX_PATH`: where the pages and index live.

## Files and folders

```text
packages/developer/repo-checks/src/node/
  constants/adr-index-path.constant.ts
  constants/adr-page-path.constant.ts
  functions/adr-status-of.function.ts
  functions/check-adr-index.function.ts
  functions/check-adr-numbers.function.ts
  functions/check-customer-adr-links.function.ts
  functions/config-findings.function.ts
  functions/description-of.function.ts
  functions/__tests__/adr-status-of.function.test.ts
  functions/__tests__/check-adr-index.function.test.ts
  functions/__tests__/check-customer-adr-links.function.test.ts
  functions/__tests__/phase-findings.test.ts
  index.ts
  types/adr-status.type.ts
  types/text-file.type.ts
apps/docs/adr/numbers.yaml
apps/docs/src/docs/adr/index.mdx
apps/docs/src/docs/adr/template.mdx
apps/docs/src/docs/adr/0531-figentra-pay-hosted-payment-suite.mdx (removed)
apps/docs/src/docs/customers/changelog.mdx
apps/docs/src/docs/customers/install.mdx
apps/docs/src/docs/customers/support.mdx
.changeset/adr-index-check.md
```

## Data models and migrations

`numbers.yaml` gains the status `external` (with a `home:` field) for a number another product took; 0531 is the first.

## Contracts

Additive exports from `@stackra/repo-checks/node`: `checkAdrIndex(files, indexText, numbersText): string[]`,
`checkCustomerAdrLinks(files): string[]`, `adrStatusOf(text): AdrStatus | undefined`,
`descriptionOf(text): string | undefined`, `ADR_PAGE_PATH`, `ADR_INDEX_PATH`, types `AdrStatus` and `TextFile`.
Behaviour change for consumers: the config phase of `stackra check` fails on the drift above.

## Error handling

A register that does not parse is reported once, by `adr-numbers`; `adr-index` then compares only the index.

## Security and tenancy

None.

## Testing strategy

- AC-001, AC-002, AC-003, AC-005: `check-adr-index.function.test.ts`.
- AC-004: `check-customer-adr-links.function.test.ts`.
- `adrStatusOf` and `descriptionOf`: `adr-status-of.function.test.ts`.
- The runner wiring: `phase-findings.test.ts` (fails with the wiring reverted).
- AC-006, P-001, P-002: `stackra check --only config` on the branch (0 findings) and with main's `apps/docs` data
  (19 findings, the audit's list).

## Rollout

A minor changeset for `@stackra/repo-checks`. Open pull requests that add an ADR page must add its index row and set
its register status before they pass: stackra#1129 (0515), and the two pull requests that both claim 0535
(stackra#1117, stackra#1041).

## Known risks

- The rule "a breaking release needs a human release note" (0013 decision 5, carried by 0025 decision 5) has no live
  ADR: 0177 superseded 0025 and carried only its decisions 3 and 4, while 0468 reads the rule as still standing. The
  support page now cites the release runbook, which enforces it; a live ADR home needs a CTO ruling.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R1.

## ADRs

None new; the ADR template and STA-1732.

## Docs

`apps/docs/src/docs/adr/template.mdx`, the index contract, the register header, the three customer pages.

## Complexity tracking

none
