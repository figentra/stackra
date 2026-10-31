# Feature Specification: Guard timing tests are load-proof

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1693

**Clarifications status**: complete

**Input**: Gate report: guard-bash timing tests fail on loaded boxes (>2 s to decide; 60 kB bounded time at 3.15 s)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: .agents/hooks (tests, one test-only option)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R0

## Behaviour

decideBash takes a deadlineMs option (default 2000) so tests about an outcome lift the deadline; every wall-clock bound in guard-bash.test.mjs is one budget under the hook's 5 s kill

## Status history

- 2026-10-30: Draft → Clarified
