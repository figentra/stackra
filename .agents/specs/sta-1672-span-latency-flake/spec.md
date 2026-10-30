# Feature Specification: deterministic latency in the pipeline span test

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1672

**Clarifications status**: complete

**Input**: regate 265/1640 (2026-10-30): the span test failed once because a measured latency of 7 ms equalled the input value 7.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/application/actions (test only)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R0 (test only)

## Behaviour

1. The span test pins performance.now, so latencyMs is a known 0 and can never equal an input value; the no-input-values assertion stays.

## Status history

- 2026-10-30: Draft → Clarified
