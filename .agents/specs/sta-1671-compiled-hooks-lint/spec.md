# Feature Specification: hooks lint on compiled class components

**Created**: 2026-10-30

**Status**: Clarified

**Linear**: STA-1671

**Clarifications status**: complete

**Input**: ADR 0305 rule 41: hooks lint runs on gen's compiled output. STA-1655 turned react/rules-of-hooks off for .tsx files in the component homes (class hook fields); owner accepted it on 2026-10-30 on condition this lint closes the gap.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/cli, packages/developer/gen (read-only use), packages/tooling/oxlint (comments)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1 (a new check phase; finds hook mistakes the carve-out hides)

## Behaviour

1. A `stackra check` step compiles every .tsx file that imports from `#stackra/ui` (the class-component module) with gen's compileClassComponents(code, file, { retainLines: true }) into a temporary folder and runs oxlint with only react/rules-of-hooks over the output.
2. Each diagnostic maps back to the source file and line (retainLines keeps lines aligned) and becomes a finding with rule `rules-of-hooks`.
3. Function components in the carved-out homes are checked the same way (a file without the class import is linted as it is), so the carve-out leaves no file unchecked.
4. The carve-out comments in the oxlint presets say the gap is closed by this step.

## Status history

- 2026-10-30: Draft → Clarified
