# Feature Specification: oxlint preset: hook fields in class components

**Created**: 2026-10-30

**Status**: Implementing <!-- builder mode: oxfmt and oxlint run here; the tester runs the rest -->

**Linear**: STA-1655

**Clarifications status**: complete

**Input**: Commerce · Services' wave-a sweep: about 55 react/rules-of-hooks hits on class component hook fields (`i18n = useTranslation()`), which ADR 0305 rules 37 and 38 allow and Commerce's AGENTS.md R7 requires; rule 41 puts hooks lint on gen's compiled output.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/tooling/oxlint
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (cites ADR 0305 rules 37 to 41)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Licence tier**: free
- **Docs to update**: the preset's own comments
- **Change risk**: R1 (lint preset)

## Behaviour

1. `react/rules-of-hooks` is off for `.tsx` component files in the component homes (`components/`, `blocks/`, `routes/`, a package's `react/` and `native/`, `*.mail.tsx`).
2. It stays on for hook files (`use-*.ts(x)`), every `.ts` file and tests.
3. A fixture test proves a class hook field passes and a conditional hook in a hook file still fails.
