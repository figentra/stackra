# Feature Specification: typescript preset: experimentalDecorators in base

**Created**: 2026-10-30

**Status**: Implementing <!-- builder mode: oxfmt and oxlint run here; the tester runs the rest -->

**Linear**: STA-1656

**Clarifications status**: complete

**Input**: Commerce wave-a (27192b15) gate: TS1240 and TS1270 at core's option schemas (config, errors, logger) and the cursor and table inputs. A member on the `library` or `node` preset reads core's decorated sources through `@stackra/source` (ADR 0025) and typechecks them as TC39 decorators.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/tooling/typescript, apps/docs (ADR 0025 note)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: a Note on ADR 0025
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Licence tier**: free
- **Docs to update**: the preset's own comments
- **Change risk**: R2 (compiler option in every preset; base's change policy asks for an ADR note)

## Behaviour

1. base.json sets `experimentalDecorators: true` and `emitDecoratorMetadata: false` beside `customConditions`, so every preset typechecks decorated workspace sources the way they are built.
2. `erasableSyntaxOnly` stays on in base.
3. presets.test.ts checks every preset resolves to legacy decorators.
