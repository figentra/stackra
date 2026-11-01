# Specification: first-hour quick fixes (stale text and a missing-binding hint)

**Feature Branch**: `figentra/sta-1818-dx-quick-fixes`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1818

**Clarifications status**: complete

**Input**: The first-hour developer-experience audit of 2026-11-01. AGENTS.md, the http-conventions rule and six skills
(with their `packages/developer/skills` copies) said `@stackra/actions`, `container`, `model`, `database`, `ai`,
`panel` and gen "do not ship yet", though they shipped in 0.3.0; the migrations skill sent readers to `stackra db diff`,
which is not built (STA-1808); and the container's missing-binding error never told a newcomer to run `stackra gen`, the
usual cause in a test.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/foundation/container` (`UnboundTokenError` message and its test);
  `packages/developer/skills` (the projected rule and skill copies)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (text and an error message)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: AGENTS.md, `.agents/rules/http-conventions.md`, six `.agents/skills/*/SKILL.md` and their copies
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** No rule or skill says a shipped package "does not ship yet".
- **FR-002** The migrations skill says migrations are written by hand until `stackra db diff` exists, with an example.
- **FR-003** `UnboundTokenError`'s message ends with a hint to run `stackra gen` when a test hits it.

## Status history

- 2026-11-01 → Clarified (audit finding)
