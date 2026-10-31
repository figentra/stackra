# Bug Specification: validate allows the committed openapi.json

**Feature Branch**: `figentra/sta-1737-openapi-json-must-stay`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1737

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01). `validate json-configs` refuses each member's committed
`openapi.json` (ADR 0294 R10), because it is not on `MUST_STAY_JSON`. Found by Commerce · Services in f4's rerun 5.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/repo-checks` (`must-stay-json.constant.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 R10 already commits the file)
- **New dependencies**: none
- **Deploy modes**: repository tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (one allow-list row)

## Requirements

- **FR-001** `MUST_STAY_JSON` holds `(^|/)openapi.json`, with gen as its reason.
- **FR-002** The `checkJsonConfigs` test passes a member-root and a repo-root `openapi.json` without a finding.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1)
