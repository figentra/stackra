# Implementation Plan: gen's check codes named as gen emits them, and built checks no longer marked planned

**Spec**: `.agents/specs/sta-2068-docs-check-names/spec.md` · **Linear**: STA-2068 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2068-docs-check-names/spec.md`

## Summary

Edit the Enforcement sections of ADR 0263, 0294, 0305 and 0307 and the Enforcement rows of the rules `ai-tools` and
`naming-and-casing`: rename `two_kinds_in_file` to `two_declarations_in_file`, and split each stale `planned —` row
into an `automated —` row naming the codes gen has (with the gen file that raises them) and a `planned —` row keeping
the rest. Regenerate the `AGENTS.md` projection with `tools/scripts/agents-sync.mjs`. Add one vitest file in
`@stackra/gen` that reads those sections, collects the backticked snake_case codes on `automated —` rows, and asserts
each is a quoted literal of gen's non-test source; it also asserts `two_kinds_in_file` appears in none of them.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`); Markdown and MDX
- **Members**: `packages/developer/gen` (`tier:lib`); `apps/docs` (`tier:app`, pages only); repository rules
  (`.agents/rules`, `AGENTS.md`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), run on ci-box
- **Storage**: none
- **Runtime target**: a test of a library; docs

## Constitution Check

| Law                                   | Result | Note                                                                                 |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | the test reads doc files from disk; it imports nothing from an app                   |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                           |
| Security                              | N/A    | docs and a test                                                                      |
| HTTP and events                       | N/A    | no endpoint or event changes                                                         |
| Tenancy                               | N/A    | no tenant data                                                                       |
| Delegation                            | PASS   | one session, one worktree; `.agents/rules` edited by this branch only                |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                               |
| Test placement (ADR 0022)             | PASS   | `src/core/constants/__tests__/gen-codes-documented.test.ts`                          |
| Versions and catalogs                 | PASS   | no dependency added; `pnpm-lock.yaml` and catalogs unchanged                         |
| Deploy modes (ADR 0076)               | N/A    | nothing deployed changes                                                             |
| Licence tier (ADR 0077)               | PASS   | free                                                                                 |
| Docs and ADRs                         | PASS   | Enforcement sections record what is built; no decision changes, so no new ADR number |

## Deploy modes

| Mode       | Behaviour                  |
| ---------- | -------------------------- |
| SaaS       | no change: docs and a test |
| On-prem    | same                       |
| Air-gapped | same                       |

## Correctness properties

- **P-001**: no checked document contains `two_kinds_in_file` — Validates: FR-001
- **P-002**: every backticked snake_case token on an `automated —` row of a checked document is a quoted literal in
  gen's non-test source — Validates: FR-002, FR-004
- **P-003**: each code moved to an `automated —` row is absent from the `planned —` rows of the same section, and each
  code left planned has no literal in gen's source — Validates: FR-002, FR-003 (example-only: checked by review of
  the diff against the list in the spec, not by the test)
- **P-004**: `AGENTS.md` equals the `agents-sync` output — Validates: FR-005 (the existing agents-sync check in
  `pnpm validate`)

## Architecture overview

Docs are the source a reader trusts; gen's source is the truth about which checks exist. The test joins them: it
reads the checked documents from the repository root (four ADR pages and two rule files), cuts each Enforcement
section into rows, keeps the rows that start with `automated —`, and compares their codes with the literals of
`packages/developer/gen/src/**/*.ts` outside `__tests__`.

## Components and responsibilities

- `gen-codes-documented.test.ts` (new): the guard. Holds the list of checked documents, the row parser (a row is a
  list item or paragraph; it ends at the next list item, blank line or heading) and the gen-literal collector.
- The six documents: each Enforcement row moves or stays as listed in the spec's acceptance scenarios.
- `AGENTS.md`: regenerated, never hand-edited (its block is generated by `tools/scripts/agents-sync.mjs`).
- `packages/developer/gen/turbo.jsonc`: a member `test` override whose inputs add the checked documents, so a docs
  edit reruns the test instead of hitting the turbo cache.

## Files and folders

- `packages/developer/gen/src/core/constants/__tests__/gen-codes-documented.test.ts` (new)
- `packages/developer/gen/turbo.jsonc` (a `tasks.test.inputs` override: `$TURBO_DEFAULT$` plus the six documents)
- `apps/docs/src/docs/adr/0263-di-stays-and-gen-writes-the-wiring.mdx`
- `apps/docs/src/docs/adr/0294-programming-model-v3-grammar-folders-identities-and-naming.mdx`
- `apps/docs/src/docs/adr/0305-programming-model-v3-1-names-partners-files-and-class-components.mdx`
- `apps/docs/src/docs/adr/0307-panel-v3-1-resource-tables-placements-widgets-slots-and-dashboards.mdx`
- `.agents/rules/ai-tools.md`, `.agents/rules/naming-and-casing.md`
- `AGENTS.md` (regenerated)

## Data models and migrations

none

## Contracts

none

## Error handling

The test's failure message lists each unknown code with the document it came from, and says to either fix the name
or move the row back to `planned —`. A document that is missing (renamed ADR file) fails the test by name, so the
list is updated rather than silently skipped.

## Security and tenancy

none

## Testing strategy

- AC-001: the test asserts no checked document contains `two_kinds_in_file`; `git grep two_kinds_in_file` is run by
  hand before the commit.
- AC-002: the test itself, run on ci-box; once with a planted `` `no_such_code` `` on a built row to see it fail
  (not committed).
- AC-003: review of the diff against the spec's acceptance scenarios; the codes left planned are checked against the
  gen literal list (`git grep`) before the commit.
- If the gen package's lint or typecheck refuses `node:fs` in a `src/core` test, the test moves to
  `src/node/__tests__/` (same name) and the spec's Files list is amended.

## Rollout

none (a docs pull request; no changeset, since no published file of `@stackra/gen` changes)

## Delegation and risk plan

One session, Claude only. Risk: a concurrent STA-340 branch edits the same Enforcement rows; merge `origin/main` in
before shipping and keep both edits. `.agents/rules/*` is one-agent-at-a-time: this branch touches two rows only.

## ADRs

Relies on ADR 0294, 0305, 0307 and 0263 as accepted; ADR 0231 (snake_case machine codes); ADR 0022 (test placement).
No new ADR.

## Docs

The four ADR pages and two rules in Impact "Docs to update", and the `AGENTS.md` projection.

## Complexity tracking

none
