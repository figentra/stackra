# Feature Specification: main's Quality Gate passes: TSDoc blocks, a typecheck cap and tsconfig without baseUrl

**Feature Branch**: `figentra/sta-2665-main-green`

**Created**: 2026-11-09

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2665

**Clarifications status**: complete

**Input**: Main's Quality Gate fails on main's own code, and merges go without an admin bypass, so no core pull
request can merge. Three causes, each of which blocked the others' fix:

1. `stackra validate --repository` reports 52 ADR 0007 findings: an export or member with no TSDoc block, or a block
   whose summary is a label under three words, in the playground and mobile demos, ai, notifications, database, ui,
   gen and repo-checks.
2. Typecheck runs ten members at once; when a change affects most members the hosted runner runs out of memory and
   loses contact mid-step (was #1008).
3. TypeScript 7 removed `baseUrl` (TS5102), and services/example and services/health still set it, as the service
   check and `stackra encore:prepare` demanded (was #990).

### Sources

- The Quality Gate logs on #1008 (run 42697728574) and #1011 (runs 42700226988, 42734775207)
- `packages/developer/repo-checks/src/node/functions/check-doc-file.function.ts` (`MIN_SUMMARY_WORDS` is 3)
- `packages/developer/repo-checks/src/node/functions/check-encore-service.function.ts`
- `packages/developer/cli/src/node/functions/prepare-encore-service.function.ts`
- ADR 0007 (file contracts and TSDoc); ADR 0091 (rule 4, tsconfig paths)

## Impact

- **Apps touched**: apps/playground, apps/mobile (demo docblocks only)
- **Services touched**: services/example, services/health (tsconfig without baseUrl)
- **Packages touched**: ai, notifications, database, ui (docblocks only); gen, repo-checks, cli (docblocks, the service
  check, encore:prepare)
- **Public contract change**: none; docblocks, a check that refuses `baseUrl`, and `encore:prepare` that removes it
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0091 rule 4 is corrected)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (no rendered text changes)
- **Docs to update**: ADR 0091
- **Lane**: full
- **Change risk**: R1 (comments, a CI flag, and a tsconfig option TypeScript already refuses)

## Acceptance criteria

- **AC-001**: THE repository validation SHALL report no ADR 0007 finding on main's code.
- **AC-002**: THE Quality Gate's Typecheck step SHALL type-check at most two members at a time.
- **AC-003**: WHEN a service's tsconfig sets `baseUrl` THE service check SHALL report it, and `stackra encore:prepare`
  SHALL remove it while keeping `paths` equal to package.json `imports`.

## Status history

- 2026-11-09 → Clarified (the three causes are main's own and block each other's fixes)
- 2026-11-09 → Planned (plan.md) — Approved by leader 2026-11-09 (the one PR a red main accepts)
- 2026-11-10 → Tasked (tasks.md; built in the same branch, #1008 and #990 merged in)
