# Feature Specification: main's unit tests pass again

**Feature Branch**: `figentra/sta-1935-main-unit-tests`

**Created**: 2026-11-02

**Status**: Implementing

**Linear**: STA-1935

**Clarifications status**: complete

**Input**: a full `turbo run test --continue` on the testbed, with #228 (STA-1911), failed in seven packages. CI showed
one per run because turbo stops at the first failed task. Each failure is a test that trailed a decided change, or one
missing generated file.

## Impact

- **Apps touched**: docs (the generated `standards/structure.mdx`)
- **Services touched**: none
- **Packages touched**: `cli`, `devtools-kit`, `iam`, `panel`, `repo-checks`, `search` (tests only); `tenancy` (its
  committed entity list and the `TENANCY_ENTITIES` export, as STA-1874 gave the other fourteen packages with models)
- **Cross-service events**: none
- **Tenancy and data**: none (no migration; the entity list is gen's runtime facts for the existing `approval_bindings`)
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Lane**: lite

## Requirements

- Tests follow the decided behaviour: 14 categories (`connectors`), no spec-kit `.specify` exemptions (#193), an
  extension's down keeps the extension (STA-1689), `ListenerContext.audit`.
- `packages/security/tenancy/src/node/entities.gen.ts` and `stackra.manifest.json` are gen's output, byte for byte.
- `apps/docs/src/docs/standards/structure.mdx` is `stackra structure --write-docs` output.
- Test fixtures that depended on the environment no longer do: iam's temp tsconfig names no ambient types; panel's
  mock renders the error in its own element.

## Not in scope

- gen's goldens (STA-1894, #229).
- `skill-licences` reading `.agents/skills/.licences.yaml`: the file is tracked; it is missing only on the testbed.
