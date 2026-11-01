# Specification: seed data under `assets/seeds` stays JSON

**Feature Branch**: `figentra/sta-1825-seeds-json`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1825

**Clarifications status**: complete

**Input**: Product gates (billing, tamo): `stackra validate`'s json-configs check tells
`services/*/assets/seeds/**/*.json` to convert to YAML, but the members' seeders load those files as JSON. The leader
asked for the path to join `MUST_STAY_JSON` (2026-11-01).

## Impact

- **Apps touched**: none
- **Services touched**: none in core; product services' seed files stop being flagged
- **Packages touched**: `packages/developer/repo-checks` (`MUST_STAY_JSON`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (a reader-forced exception in the existing list)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `MUST_STAY_JSON` lists `assets/seeds/<group…>/<name>.json`, with its reader.
- **FR-002** The json-configs test passes a seed file and still flags other JSON.

## Status history

- 2026-11-01 → Clarified (leader request)
