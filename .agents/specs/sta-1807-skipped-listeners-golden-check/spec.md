# Specification: events testing records skipped listeners; repo-checks refuses gitignored goldens

**Feature Branch**: `figentra/sta-1807-skipped-listeners-golden-check`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1807

**Clarifications status**: complete

**Input**: The events testing plugin only warns when it skips a listener whose dependency nothing binds, so a test cannot
assert it. Separately, the root `.gitignore` rule `**/.stackra/*` silently dropped golden files under
`packages/developer/gen/__golden__/**/expected/**/.stackra/` (fixed by commit 6004bcfd); nothing stops it recurring.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/foundation/events` (testing plugin, test, README); `packages/developer/repo-checks` (new check)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: events README (testing note)
- **Lane**: lite
- **Change risk**: R1 (testing entry and a repository check)

## Requirements

- **FR-001** `app.listeners.skipped()` returns the listeners the events testing plugin skipped for an unbound dependency, with the missing class; the warning stays.
- **FR-002** `checkIgnoredGoldens` reports each file under a `__golden__` directory that git would ignore, telling the author to add a `.gitignore` re-include.
- **FR-003** Tests for both.

## Status history

- 2026-11-01 → Clarified
