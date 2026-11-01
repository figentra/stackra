# Bug Specification: validate allows the OS repo's strict JSON files

**Feature Branch**: `figentra/sta-1794-must-stay-json-rows`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1794

**Clarifications status**: complete

**Input**: Leader, for 0.2.2 (2026-11-01). `stackra validate --repository` (`json-configs`) refuses four kinds of
strict JSON in figentra/os, so os#22 and #27 stay red: the expected and fixture JSON outputs under `tools/lines/`, the
mobile app's `capabilities.json` (Runway's `capabilityConfig` reads it) and the edge worker's `edge.json` (its scripts
`JSON.parse` it).

## Impact

- **Apps touched**: none in core
- **Services touched**: none
- **Packages touched**: `packages/developer/repo-checks` (`must-stay-json.constant.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (each row names its reader, as the list's contract asks)
- **New dependencies**: none
- **Deploy modes**: repository tooling only
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R1 (allow-list rows)

## Requirements

- **FR-001** `MUST_STAY_JSON` rows: `tools/lines/{expected,fixture}/*.json`, `apps/<app>/capabilities.json`,
  `workers/<worker>/edge.json`, each with its reader.
- **FR-002** The `checkJsonConfigs` test passes each without a finding.

## Status history

- 2026-11-01 → Clarified (leader's 0.2.2 item)
