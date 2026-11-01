# Feature Specification: registry switches for the Figentra Registry move

**Feature Branch**: `figentra/sta-1733-registry-switches`

**Created**: 2026-10-31

**Status**: Implementing <!-- the owner approved the STA-1733 plan with these switches, 2026-10-31 -->

**Linear**: STA-1733

**Clarifications status**: complete

**Input**: The core part of the Figentra Registry move. The full spec and plan live in figentra/figentra
`.agents/specs/sta-1733-figentra-registry/` (PR figentra/figentra#6). The Worker gets three small switches before
it moves, so the old Worker can be frozen during the data copy and publishers can use either host.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `workers/registry` (settings, OIDC exchange, the router, the browse footer, wrangler.jsonc)
- **Cross-service events**: none
- **Tenancy and data**: none; read-only stops writes, it changes no data
- **Secrets**: none; the `wrangler.jsonc` comment now names the signing key's real path, Infisical `prod` `/ci/registry`
- **ADR needed**: no; ADR 0453 is amended by the move itself (figentra/figentra plan, section 11)
- **New dependencies**: none
- **Deploy modes**: the registry Worker, through the owner's "Deploy registry" run
- **Licence tier**: unchanged
- **Docs to update**: `workers/registry/README.md` (settings)
- **Lane**: lite
- **Change risk**: R2 (the production registry; both switches default off)

## Requirements

- **FR-001** `REGISTRY_OIDC_AUDIENCES`, a JSON array: the token exchange accepts any listed audience. Empty or unset
  means `["npm:<REGISTRY_HOST>"]`, today's behaviour.
- **FR-002** `REGISTRY_READ_ONLY`: when `"true"`, every request other than `GET`/`HEAD` answers 503
  `registry_read_only` with `Retry-After`; reads are unchanged. Licence writes stop too, so none is lost between the
  export and the switch.
- **FR-003** The browse page footer shows `REGISTRY_HOST`, not a literal host.
