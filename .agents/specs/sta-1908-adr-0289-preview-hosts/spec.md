# Feature Specification: ADR 0289 records which hosts previews use

**Feature Branch**: `figentra/sta-1908-adr-0289-preview-hosts`

**Created**: 2026-11-01

**Status**: Implementing <!-- owner decision via the leader, 2026-11-01, after the pay preview mapping (STA-1907) -->

**Linear**: STA-1908

**Clarifications status**: complete

**Input**: ADR 0289 decision 7 puts pull-request previews under one host, `pr-<n>.figentra.cloud`, served by a preview
router Worker. The 2026-11-01 note on ADR 0290 (STA-1889) moved product surfaces to ADR 0437's
`<host>.<env>.figentra.com` naming. The mapping for STA-1907 found per-PR previews unbuilt, and the owner decided how the
two names split: per-PR previews keep figentra.cloud, and the shared `preview` environment keeps 0437's
preview.figentra.com.

## Impact

- **Apps touched**: `apps/docs` (one ADR's note)
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (a dated note on 0289 records the owner's decision)
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: internal
- **Docs to update**: ADR 0289
- **Lane**: chore
- **Change risk**: R0 (documentation)

## Requirements

- **FR-001** ADR 0289 carries a dated note (2026-11-01, STA-1908): per-pull-request previews keep decision 7's
  `pr-<n>.figentra.cloud`, because a separate registrable domain isolates preview cookies and storage from figentra.com
  production and one label under one zone takes one wildcard certificate; the shared `preview` environment keeps ADR
  0437's `<host>.preview.figentra.com`; building the per-PR path is STA-1907.
