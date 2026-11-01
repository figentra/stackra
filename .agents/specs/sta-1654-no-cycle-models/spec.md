# Feature Specification: oxlint preset: no-cycle among models

**Created**: 2026-10-30

**Status**: Implementing <!-- builder mode: oxfmt and oxlint run here; the tester runs the rest -->

**Linear**: STA-1654

**Clarifications status**: complete

**Input**: Commerce · Services' wave-a sweep: about 60 import/no-cycle hits on two-way model relations, where `@ManyToOne(() => X)` thunks need value imports both ways.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/tooling/oxlint
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Licence tier**: free
- **Docs to update**: the preset's own comments
- **Change risk**: R1 (lint preset; the rule stays on everywhere but model files)

## Behaviour

1. `import/no-cycle` is off in `**/src/**/models/*.ts` only.
2. A cycle through any non-model file (a model importing a service that imports it back) still fails at that file.
3. A fixture test runs oxlint over a two-way relation and a model-service cycle.
