# Feature Specification: deps: lift fast-xml-parser and node-forge past tonight's advisories

**Feature Branch**: `figentra/sta-2691-osv-overrides`

**Created**: 2026-11-11

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2691

**Clarifications status**: complete

**Input**: OSV-Scanner in the Quality Gate (ADR 0174) is red on core's lockfile for every pull request since
advisories published overnight: `fast-xml-parser` 5.7.3 (fixed in 5.12.0, GHSA-474x-hrwr-fgx4) and `node-forge` 1.4.1
(fixed in 1.4.3, four advisories). Both are transitive. The ADR 0174 pattern applies: the vulnerable range is lifted
to the first fixed release of the same major by a `pnpm-workspace.yaml` override.

### Sources

- stackra#1027's run 42919833723 (Dependency scan, OSV-Scanner)
- `pnpm-workspace.yaml` `overrides:` (the ADR 0174 block); pay#241 (the same fix in pay)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (the workspace's resolved transitive versions only)
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: two transitive packages move past published advisories
- **Secrets**: none
- **ADR needed**: no (ADR 0174's override pattern)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R1 (patch and minor versions of two transitive packages)

## Acceptance criteria

- **AC-001**: THE lockfile SHALL resolve no `fast-xml-parser` below 5.12.0 in the 5.x line and no `node-forge` below 1.4.3.
- **AC-002**: WHEN the Quality Gate's dependency scan runs on this branch THE OSV-Scanner step SHALL pass.

## Status history

- 2026-11-11 → Clarified (leader: two overrides, the lockfile from CI's regen)
- 2026-11-11 → Planned (plan.md) — Approved by leader 2026-11-11
- 2026-11-11 → Tasked (tasks.md)
