# Feature Specification: release: the 0.33.1 boot set in one merge

**Feature Branch**: `figentra/sta-2690-release-0-33-1-boot`

**Created**: 2026-11-11

**Status**: Tasked

**Tier**: feature

**Approver**: leader (decided under the owner's delegation, 2026-11-11)

**Linear**: STA-2690

**Clarifications status**: complete

**Input**: STA-2663 and STA-2664 (the 0.33.1 boot set). `main-protection` requires a branch to be up to date before it
merges, so the boot drafts merge in one pull request, as STA-2685 did for 0.33.0. Each brings its own spec,
changeset and tests unchanged; conflicts between two of them, or with main since they were opened, are resolved
once here and named in the pull request body. A draft that cannot be made green here drops to 0.33.2 by name.

### Sources

- stackra#1014 (STA-2666), #1015 (STA-2667), #1023 (STA-2678), #1020 (STA-2674), #1022 (STA-2677), #1021
  (STA-2675), #1017 (STA-2671), #1018 (STA-2672), #1024 (STA-2679)
- the leader's plan of 2026-11-11

## Impact

- **Apps touched**: as the nine pull requests touch them
- **Services touched**: as the nine pull requests touch them
- **Packages touched**: as the nine pull requests touch them (gen, cli, runway, config, contracts, identity,
  settings, storage, database, infra-testbed)
- **Public contract change**: the nine pull requests' own, each with its changeset
- **Cross-service events**: none beyond the nine
- **Tenancy and data**: #1022's field cipher over the tenant key provider, as reviewed there
- **Security and privacy**: #1024's dev secrets file, as reviewed there
- **Secrets**: generated dev values only (#1024)
- **ADR needed**: no; the nine carry their own ADR notes (0091, 0159, 0525)
- **New dependencies**: none beyond the nine
- **Deploy modes**: as the nine
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none beyond the nine
- **Lane**: full
- **Change risk**: R2 (the highest of the nine)

## Acceptance criteria

- **AC-001**: THE branch SHALL contain the included pull requests' heads, merged in stack order with `chore: merge` commits, plus the conflict resolutions named in the pull request body.
- **AC-002**: WHEN the branch's gate runs THE Quality Gate SHALL be green on its head before it is marked ready.

## Status history

- 2026-11-11 → Clarified (leader: one combined PR; anything not green drops to 0.33.2)
- 2026-11-11 → Planned (plan.md) — Approved by leader 2026-11-11
- 2026-11-11 → Tasked (tasks.md)
