# Feature Specification: copyright holder is Fulers Technologies L.L.C.

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1678

**Clarifications status**: complete

**Input**: Owner decision 2026-10-30 (via the leader): the copyright holder and trademark owner is the registered entity Fulers Technologies L.L.C.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: every packages/**/LICENSE; workers/static and workers/registry (copyright footers)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: dated Notes on ADRs 0024 and 0291
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: ADRs 0024 and 0291 (Notes), TRADEMARKS.md, NOTICE files
- **Lane**: lite
- **Change risk**: R0 (legal text only)

## Behaviour

1. Every LICENSE, NOTICE, TRADEMARKS.md and copyright footer names Fulers Technologies L.L.C.
2. Accepted ADRs 0024 and 0291 get a dated Note recording the correction, not a rewrite.
3. Not changed: product names, the @stackra and @stackra-pro scopes, package.json author fields ("Figentra (https://figentra.com)", the brand), comments naming the Cloudflare account, and the owner's quoted words in an older spec.

## Status history

- 2026-10-30: Draft → Clarified
