# Feature Specification: Hosts register hosted packages' permissions and roles

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1710

**Clarifications status**: complete

**Input**: Leader follow-up to STA-1702: a service's boot registers only its own permission sets, never its hosted packages'

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/gen
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R2

## Behaviour

Manifest permission entries carry module, member and file; a roles section lists module roles; a host's registrations register every permission set and role in its merged manifest, own and hosted

## Status history

- 2026-10-30: Draft → Clarified
