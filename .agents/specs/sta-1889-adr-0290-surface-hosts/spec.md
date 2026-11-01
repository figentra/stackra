# Feature Specification: ADR 0290 records which naming product surfaces use

**Feature Branch**: `figentra/sta-1889-adr-0290-surface-hosts`

**Created**: 2026-11-01

**Status**: Implementing <!-- owner decision via the leader, 2026-11-01, after pay's first dev deploy -->

**Linear**: STA-1889

**Clarifications status**: complete

**Input**: ADR 0290 makes figentra.cloud the dev and preview zone, one label deep (`<app>-<dev>`, `<app>-staging`).
The OS edge built from ADR 0437 serves product surfaces at `<host>.<env>.figentra.com` (production unlabelled), and pay's
first dev deploy resolved its surfaces that way. The owner decided product surfaces follow 0437 and the live edge, and
figentra.cloud stays the tunnel and dev-machine zone.

## Impact

- **Apps touched**: `apps/docs` (one ADR's note)
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (a dated note on 0290 records the owner's decision)
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: internal
- **Docs to update**: ADR 0290
- **Lane**: chore
- **Change risk**: R0 (documentation)

## Requirements

- **FR-001** ADR 0290 carries a dated note (2026-11-01, STA-1889): product surfaces use ADR 0437's naming,
  `<host>.<env>.figentra.com` with production unlabelled, set per environment as a product runway's
  `environments.<env>.domains.zone`; figentra.cloud stays the zone for tunnels and dev machines (decisions 1, 2 and 4).
