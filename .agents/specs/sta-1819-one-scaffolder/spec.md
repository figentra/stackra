# Specification: one scaffolder, `stackra new service`, that gen accepts on first run

**Feature Branch**: `figentra/sta-1819-one-scaffolder`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1819

**Clarifications status**: complete

**Input**: A read-only DX audit found two service scaffolders that each fail a first run. Base of this spec: the train
`land/031-stack`, where `tools/scripts/scaffold.mjs` has already moved into the CLI (`c7cfe220`,
`packages/developer/cli/src/node/scaffold/`) and the root `new` script is already the one-line alias
`node packages/developer/cli/dist/stackra.mjs new` (ADR 0500 decision 6). What is still wrong on that base:

- `stackra new service` (`packages/developer/cli/src/node/functions/service-template.function.ts`, routed by
  `src/node/constants/new-command.constant.ts`) writes `defineService`, the `@stackra/app`, `container` and `contracts`
  dependencies and `stackra <task>` scripts, but nothing under `src/` and no test, while the vitest preset fails an
  empty suite (`packages/tooling/vitest/src/preset.ts:31`, `passWithNoTests: false`). It requires `--area`, so the
  acceptance command below fails at the usage check today.
- The old service template, `tools/scaffold/templates/services/service/`, is still rendered by the moved `scaffold`
  function (`SCAFFOLD_KINDS.service`) and its test, but `stackra new service` never reaches it. It has the root
  module, a config class and a test, and authored `vitest.config.ts` and `tsdown.config.ts` that do not import
  `./.stackra/<tool>.config`, which gen refuses as `shim_authored`
  (`packages/developer/gen/src/node/functions/generate.function.ts`, `TOOL_CONFIGS` and `mergesGenerated`). Its
  `stackra.config.ts` is `export default {}`, its scripts call tools directly, and it alone carries the four PGlite
  test peers STA-1812 added.
- Neither adds `@stackra/testing` or `testcontainers`, and neither has a `test:int` script. `stackra test` takes only
  `--tier unit|e2e` (`resolve-tool.function.ts`), and the int tier today needs an authored `vitest.int.config.ts`
  (`packages/tooling/vitest/src/int.ts`), which is a tool config.
- Outside a pnpm workspace, `workspaceRoot` falls back to the cwd and `memberNaming` picks `workspace:*`, so a member
  written into a fresh folder names versions nothing can resolve. The consumer gate's `kind: scaffold` consumer
  (STA-1813, FR-013 of `sta-1813-product-gate`) exits 2 for that reason.

## Decision

One scaffolder: `stackra new service` in `@stackra/cli` (ADR 0500 decision 4: `scaffold` is merged into
`stackra new`). The CLI's own `serviceTemplate` is the base, because it already has the v3 shape gen wants; it gains a
root module and one passing test, the `--data` extras and a fresh-workspace target. The old template folder and the
`service` kind of `SCAFFOLD_KINDS` are deleted. `pnpm new` is already the one-line alias. No tool config is ever
written: gen writes its shims on the first run (ADR 0295).

## User stories

- **US1 (P1)** A developer in core runs `stackra new service demo --summary "…"`, then `stackra gen`, then
  `stackra test`, and all three pass with no hand edit.
- **US2 (P2)** With `--data`, the member also has the DB testing peers, one model with its migration, a unit test on
  PGlite, one `.int.test.ts` and a `test:int` script.
- **US3 (P3)** The consumer gate runs `stackra new service demo --into <temp dir>` against a folder outside core, and
  the result installs and passes US1's three commands against the registry or packed `@stackra/*` versions.
- **US4 (P3)** The old service template is gone and the docs name one command.

## Impact

- **Apps touched**: `apps/docs` (`src/docs/guides/scaffolding.mdx`, `src/docs/quickstart.mdx`)
- **Services touched**: none (`services/README.md` is documentation only)
- **Packages touched**: `packages/developer/cli` (`service-template.function.ts`, `new-command.constant.ts`,
  `resolve-tool.function.ts`, `scaffold/constants/scaffold-kinds.constant.ts`, their tests); `packages/developer/gen`
  only if Q2 keeps its proposed answer (gen writes `.stackra/vitest.int.config.ts`); `tools/scaffold` (the service
  template and its README rows are deleted)
- **Cross-service events**: none
- **Tenancy and data**: none at runtime; the `--data` example model is scaffold output, its tenancy shape set by Q4
- **Secrets**: none
- **ADR needed**: no (carries out ADR 0500 decisions 4 and 6, ADR 0295 on generated tool configs, ADR 0182 decision 1
  on test tiers, ADR 0305 on the optional root module; Q1 and Q3 would need one only if the leader answers against the
  proposal)
- **New dependencies**: none for the CLI; the scaffolded member names catalog entries that exist (`@faker-js/faker`,
  `@electric-sql/pglite`, `@electric-sql/pglite-pgvector`, `@mikro-orm/pglite`, `testcontainers`) and `@stackra/testing`
- **Deploy modes**: all, no change (a developer command; nothing deployed)
- **Licence tier**: free (`@stackra/cli`)
- **Docs to update**: `apps/docs/src/docs/guides/scaffolding.mdx`, `apps/docs/src/docs/quickstart.mdx`,
  `services/README.md`, `tools/scaffold/README.md`, `tools/scaffold/templates/services/README.md` (deleted with the
  template), `packages/developer/cli/README.md` (the `new` usage)
- **Lane**: full (two members plus docs and tooling, a CLI contract change, over 400 lines)
- **Change risk**: R2 (a public CLI contract: new flags and a new `--tier` value; no auth, data or secrets)

## Requirements

- **FR-001** `stackra new service <name>` writes, beside today's files, the root module `src/<name>.module.ts`
  (`export class <Pascal>Module extends Module({}) {}` from `@stackra/container`) and
  `src/__tests__/<name>.module.test.ts`, which builds it with `createTestingModule(<Pascal>Module).compile()` from
  `@stackra/container/testing` and asserts the compiled module resolves.
- **FR-002** It writes no tool config (`vitest.config.ts`, `tsdown.config.ts`, `vitest.int.config.ts` or any other):
  the first `stackra gen` writes gen's shims and reports no `shim_authored` error.
- **FR-003** `--area` follows Q1. With the proposed answer it stays required and the acceptance command names it.
- **FR-004** `--summary` stays optional and becomes `stackra.summary` when given (today's behaviour).
- **FR-005** `--data` adds to `devDependencies` `@electric-sql/pglite`, `@electric-sql/pglite-pgvector`,
  `@mikro-orm/pglite`, `@faker-js/faker`, `@stackra/testing` and `testcontainers`; writes one module
  `src/modules/<name>/` with one model, one migration under `database/migrations/`, a unit test that runs the
  migration on PGlite, and one `.int.test.ts`; and adds the script `"test:int": "stackra test --tier int"`. Without
  `--data` there is no `test:int` script, as the root `turbo.jsonc` defines it only for members with int tests.
- **FR-006** `stackra test --tier int` runs vitest with the generated int config (Q2), so no member authors one.
- **FR-007** `--into <dir>` (name per Q3) writes the member under `<dir>/services/<name>`. When `<dir>` holds no
  `pnpm-workspace.yaml`, it also writes a minimal workspace root: `package.json`, `pnpm-workspace.yaml` with
  `packages: ["services/*"]` and the catalogs the member names, the `stackra` catalog pinned to the running CLI's
  version, and an `.npmrc` naming the Stackra registry (ADR 0453). An existing workspace root is never overwritten.
- **FR-008** `--over` keeps its guarantee: it never writes under `src/`, so a regenerated member's modules, root
  module and tests are untouched. The `src/` files of FR-001 and FR-005 are written on create only.
- **FR-009** The service kind of the template path is removed: `tools/scaffold/templates/services/service/`,
  `SCAFFOLD_KINDS.service` and the scaffold test's service cases are deleted (Q5). The validator assertion they held
  (`checkService` passes on the rendered member) moves to the `new` command's test.
- **FR-010** The service's next-steps line reads `pnpm install`, then `stackra gen`, then `stackra test`, in the
  member folder.
- **FR-011** A CLI test renders the service into a temp folder, with and without `--data` and `--into`, and asserts:
  the files of FR-001 and FR-005, no tool config, `checkService` clean, `test:int` only with `--data`, and the
  workspace files of FR-007 only when the target had none.
- **FR-012** The docs of Impact name one command, `stackra new service` (with `pnpm new service` as its alias), its
  flags, and the three-command first run.

## Acceptance criteria

- **SC-001** On a clean clone of core at the feature's head, on the ci-box: `stackra new service demo --area app
--summary "Demo."` (the `--area` per Q1), `pnpm install`, then in `services/demo` `stackra gen` and `stackra test`
  pass with zero hand edits.
- **SC-002** The same with `--data` also passes `stackra test`; `stackra test --tier int` (the `test:int` script) passes where Docker is available.
- **SC-003** In an empty temp folder outside core, `stackra new service demo --area app --repo .` (the flag per Q3) then `pnpm install`,
  `stackra gen` and `stackra test` pass against packed `@stackra/*` tarballs (the consumer gate's pack mode); the
  STA-1813 `kind: scaffold` consumer stops exiting 2 once its runner calls this.
- **SC-004** `tools/scaffold/templates/services/` is gone and `stackra new --help` lists one service path.

## Out of scope

- `stackra new package` and the app kinds keep their behaviour here. Q6 records that they share part of the defect.
- The consumer gate's runner itself (STA-1813); this spec only makes its scaffold step possible.
- stackra-template and product repositories, which switch to the published CLI under ADR 0500 decision 13.

## Open questions for the leader

Each has a proposed answer; the plan assumes the proposal until told otherwise.

1. **Q1 `--area` default.** The service template's file contract says the area is "the author's choice, passed in,
   never defaulted", and the brief's acceptance command omits it. Proposed: keep it required and put `--area app` in
   the acceptance command and the docs; defaulting it would need the owner, since an area sets auth exposure
   (ADR 0082).
2. **Q2 Where the int config comes from.** Proposed: gen writes `.stackra/vitest.int.config.ts` (the generated
   vitest config wrapped in `intTier` from `@stackra/vitest-config/int`) for a member that has an `.int.test.ts`, and
   `stackra test --tier int` runs it. The alternative, an authored `vitest.int.config.ts` that wraps the generated
   one, is a tool config ADR 0295 says nobody writes.
3. **Q3 Flag name.** The brief says `--into <dir>`; the template kinds already take `--repo <path>` for the same
   meaning (scaffold into another monorepo). Proposed: one flag, `--repo`, for every kind, and FR-007's fresh
   workspace behaviour hangs on it; no second flag.
4. **Q4 The `--data` example.** Proposed: the model, migration and test are the consumer-gate fixture's
   (`tools/consumer-gate/scaffold-fixture/`, STA-1813), so one example exists; it is a plain non-tenant model, and the
   README points to the tenancy rule for the first tenant-owned table.
5. **Q5 Deleting the old template.** This deletes `tools/scaffold/templates/services/service/` and its README rows,
   including the config class `src/config/<name>.config.ts` the old template wrote. Proposed: delete it, with no
   config class in the new output (a service adds one when it has settings). Needs the leader's OK.
6. **Q6 Packages and apps.** `stackra new package` without flags (CLI `packageTemplate`) writes nothing under `src/`
   and no test, and the package and app templates ship authored `vitest.config.ts` and `tsdown.config.ts` that do not
   import `./.stackra/<tool>.config`, the same `shim_authored` shape where gen writes those configs. Proposed: a
   follow-up issue per kind, not this spec, so this change stays one command.

## Status history

- 2026-11-01 → Clarified (leader brief; open questions carry proposed answers)
