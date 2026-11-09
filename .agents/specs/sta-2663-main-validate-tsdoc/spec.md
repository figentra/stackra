# Feature Specification: main's validate is green: the 52 missing or label-only TSDoc blocks

**Feature Branch**: `figentra/main-validate-tsdoc`

**Created**: 2026-11-09

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2663

**Clarifications status**: complete

**Input**: The Quality Gate's "Validate repository" step fails on main's own code: `stackra validate --repository`
reports 52 ADR 0007 findings (an export or member with no TSDoc block, or a block whose summary is under three words)
in the playground and mobile demos, ai, notifications, database, ui, gen and repo-checks. Merges now go without an
admin bypass, so no core pull request can merge until main's validate passes.

### Sources

- The "Validate repository" log of the Quality Gate on #1008 (run 42697728574)
- `packages/developer/repo-checks/src/node/functions/check-doc-file.function.ts` (`MIN_SUMMARY_WORDS` is 3)
- ADR 0007 (file contracts and TSDoc)

## Impact

- **Apps touched**: apps/playground, apps/mobile (demo docblocks only)
- **Services touched**: none
- **Packages touched**: ai, notifications, database, ui, gen, repo-checks (docblocks only)
- **Public contract change**: none; comments only
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (no rendered text changes)
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R0 (comments only)

## Acceptance criteria

- **AC-001**: EVERY finding in the run SHALL have a TSDoc block whose summary is a sentence of three or more words
  saying what the export or member is for.
- **AC-002**: THE change SHALL alter no code, only comments.

## Status history

- 2026-11-09 → Clarified (the findings are main's own; the fix is the docblocks)
- 2026-11-09 → Planned (plan.md) — Approved by leader 2026-11-09 (first item: a red main accepts only this)
- 2026-11-09 → Tasked (built in the same branch)
