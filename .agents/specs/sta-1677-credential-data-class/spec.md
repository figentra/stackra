# Feature Specification: Credential data class for provider secrets

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1677

**Clarifications status**: complete

**Input**: Owner-approved 2026-10-30 (via the leader): provider secrets (OAuth tokens, client secrets, API keys, PKCE verifiers) need their own class; OS integrations marks them Personal today, which puts them in exports and subject-access responses and erases them with a person.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts, packages/data/model, packages/security/privacy, packages/security/access-log, packages/experience/panel, packages/developer/gen, packages/security/iam (whichever consumers read the classification)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0494 (amends 0134 and 0380)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: the new ADR, the ADR index, and the consumers' README and AGENTS.md
- **Lane**: lite
- **Change risk**: R2 (data classification: export, erasure and access-log behaviour)

## Behaviour

1. `DataClassification.Credential` (`credential`): a provider secret.
2. Always encrypted: gen refuses a Credential field that is not encrypted.
3. Never in an export (panel export, subject-access response), even when other classified columns are opted in.
4. Every read is access-logged.
5. Deleted with the owning record, never by a person's erasure; the erasure flow skips it.
6. ADR 0494 amends the classification ADR (0134, and 0380's built-in class effects); renumber at landing if 0494 is taken.

## Status history

- 2026-10-30: Draft → Clarified
