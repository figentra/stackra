# Implementation Plan: one scaffolder, `stackra new service`, that gen accepts on first run

**Spec**: `spec.md` · **Linear**: STA-1819 · **Branch**: `figentra/sta-1819-one-scaffolder` (base `land/031-stack`)

This Mac runs only oxfmt and oxlint; tests, gen and the acceptance runs go to the ci-box through the testing session.
The plan assumes the proposed answers of the spec's open questions (Q1 to Q6).

## Design

- `serviceTemplate` stays the one service template. It gains the root module and its test (FR-001), and, behind an
  option `data`, the extra devDependencies, the example module and the `test:int` script (FR-005). It still returns
  text only.
- `NEW_COMMAND` routes `service` as today, passes `--data` to `serviceTemplate`, skips every `src/` path under
  `--over` (FR-008), and prints the three-step next line (FR-010).
- The target (`--repo`, Q3) resolves before `workspaceRoot`. A target with no `pnpm-workspace.yaml` gets a minimal root
  from a new pure function `workspaceTemplate({ cliVersion, catalogs })`: the catalog entries are the ones the
  member's `package.json` names, copied from the catalogs the CLI ships with its build (FR-007). `memberNaming` then
  reads the written `stackra` catalog, so it picks `catalog:stackra` with no change.
- `resolve-tool.function.ts` accepts `--tier int` for a service or package and runs
  `vitest run --config .stackra/vitest.int.config.ts`; gen writes that file for a member with an `.int.test.ts`
  (FR-006, Q2).
- The service kind leaves `SCAFFOLD_KINDS` and `tools/scaffold/templates/services/` (FR-009); the root `new` alias is
  already one line and does not change.

## Constitution Check

| Law                       | Result | Note                                                                                   |
| ------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | the CLI imports only packages it already depends on; gen stays in its own member       |
| Secrets (ADR 0173)        | PASS   | none; the written `.npmrc` names the registry URL only, never a token                  |
| Security                  | PASS   | writes only inside the target folder; never overwrites an existing workspace root      |
| Tenancy                   | N/A    | no runtime data; the `--data` example is a non-tenant model (Q4)                       |
| Not built yet (ADR 0227)  | PASS   | nothing listed is introduced                                                           |
| Test placement (ADR 0022) | PASS   | the scaffolded tests and the CLI tests sit in `__tests__/` beside their subjects       |
| Versions and catalogs     | PASS   | the member names `catalog:` and `catalog:stackra` only; the fresh root pins exact ones |

## Deploy modes

| Mode       | Effect                                                                           |
| ---------- | -------------------------------------------------------------------------------- |
| saas       | none; a developer command                                                        |
| on-prem    | none; a developer command                                                        |
| air-gapped | none; `--repo` into a fresh folder needs a reachable registry or packed tarballs |

## Properties

- **P-001** Validates: FR-001, FR-002. A rendered service holds `src/<name>.module.ts` and a `createTestingModule` test, and no tool config file.

- **P-002** Validates: FR-003, FR-004. The usage check refuses a service with no `--area`, and `--summary` lands in `stackra.summary` only when given.

- **P-003** Validates: FR-005. With `--data` the member names the six test devDependencies, the example module files and `test:int`; without it, none of them.

- **P-004** Validates: FR-006. `resolveTool("test", { tier: "int" })` returns vitest on `.stackra/vitest.int.config.ts`, and gen writes that file only for a member with an `.int.test.ts`.

- **P-005** Validates: FR-007. Into an empty folder the command writes the workspace root with `catalog:stackra` at the CLI's version; into an existing root it writes no root file.

- **P-006** Validates: FR-008. `--over` over a member with edited `src/` files writes and diffs nothing under `src/`.

- **P-007** Validates: FR-009, FR-011. `SCAFFOLD_KINDS` has no `service` key, the template folder is gone, and the `new` test asserts `checkService` is clean on the rendered service.

- **P-008** Validates: FR-010. The printed next line names `pnpm install`, `stackra gen` and `stackra test`.

- **P-009** Validates: FR-012. The docs grep finds no `templates/services/service` and no `pnpm new service` without `stackra new service` beside it.

## Phases (one pull request each, ADR 0120 D8)

| Phase | Story | What                                                                                   | Gate                                |
| ----- | ----- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| 1     | US1   | root module and test in `serviceTemplate`; `--over` skips `src/`; next line; CLI tests | cli tests; SC-001 on the ci-box     |
| 2     | US2   | `--data` extras; `--tier int` in `resolve-tool`; gen writes the int config; tests      | cli and gen tests; SC-002           |
| 3     | US3   | `--repo` into a fresh folder: `workspaceTemplate`, the shipped catalogs; tests         | cli tests; SC-003 in pack mode      |
| 4     | US4   | delete the service template and kind; move the validator assertion; docs of Impact     | cli tests; `stackra validate`; docs |

Each phase lands with `pnpm verify` green on the ci-box. Phase 3 hands the STA-1813 runner its scaffold step; that
runner change stays in STA-1813.

## Risks

- The `createTestingModule` test needs gen's vitest setup to register the root module's wiring; if an empty module
  registers nothing, the test asserts the compiled module only, never a provider.
- The shipped catalogs drift from core between CLI releases; they are copied at CLI build time, so a release always
  matches the core it was built from.
