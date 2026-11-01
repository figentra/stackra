# Feature Specification: one Infisical layout (secrets standard)

**Feature Branch**: `figentra/sta-1867-secrets-standard`

**Created**: 2026-11-01

**Status**: Implementing <!-- owner decisions 2026-11-01: hybrid layout, figentra-agents, Academorix archived, agent does structure -->

**Linear**: STA-1867

**Clarifications status**: complete

**Input**: The owner's Infisical audit of 2026-11-01 found copies of the same tokens, CI folders that no identity can
read, workflows reading paths that do not exist, and writers landing in the wrong project. The owner chose one layout
for every repository: projects by reader, one agents vault and product runtime projects (ADR 0512).

## Impact

- **Apps touched**: `apps/docs` (ADR 0512, setup and monitoring runbooks)
- **Services touched**: none
- **Packages touched**: `packages/developer/runway` (`deployPlan` emits `/runtime/<member>`)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: names, project ids and paths only. The values are moved by the owner. The project ids are not secrets.
- **ADR needed**: yes, ADR 0512 (reserved in figentra/stackra#199)
- **New dependencies**: none
- **Deploy modes**: CI and developer machines; runtime folders apply from the first product runtime secret (STA-606)
- **Licence tier**: free (internal tooling)
- **Docs to update**: the secrets rule, setup and monitoring runbooks, the registry and turbo-cache READMEs, the
  workflows README
- **Lane**: lite
- **Change risk**: R2 (CI secret wiring and the secrets writers)

## Requirements

- **FR-001** `.infisical.yaml` binds `figentra-agents` `dev`.
- **FR-002** `secrets:import` and `pnpm vault` take a project (the sidecar's `project`, or `--project`).
  - `/agents` defaults to `figentra-agents`.
  - A `/ci` target without a project is refused.
  - The confirm token binds the project.
- **FR-003** `vault preflight` resolves each CI name to its home project. The store kit lives in `figentra-ci-deploy`
  `/ci/store`.
- **FR-004** `deployPlan` gives each member `<runtime path>/<member>`.
- **FR-005** No workflow names an Infisical project id literally.
  - `apply-observability` uses the deploy variables.
  - `deploy-turbo-cache` reads `TURBO_TOKEN` from `figentra-ci`.

## Not built here

- Moving values between projects, and identity trust or grant changes. These are the owner's, from the checklist in
  the side-session notes.
- Fixing `vault-keeper.mjs`'s import of the removed `tools/scripts/runway.mjs`.
- A repo check that refuses an Infisical project id literal in a workflow.
