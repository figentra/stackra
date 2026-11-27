# Feature Specification: stackra new adds the pieces of a feature (module, model, migration, action, query)

**Feature Branch**: `figentra/sta-2855-new-feature-generators`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (technical stop; approval pending)

**Linear**: STA-2855

**Clarifications status**: complete

**Input**: `stackra new` made whole members (a package, a service, a seed pack, an app) but nothing inside one.
`SCAFFOLD_KINDS` listed member kinds only (audit of 26 Nov, item 13.2). To add a module, a model, its migration, an
action or a query, a developer copied the example notes module and had to know every rule gen checks: the permission
an action or query derives, the L2 floor for writes, the written idempotency, the public id prefix registry, the tenant
column on owned tables, one declaration per file and the `schemas/` folder. Phase 4 of STA-1952 ("add a module with
`stackra new`, regenerate, test and redeploy") relies on a generator.

### Sources

- `packages/developer/cli/src/node/constants/new-command.constant.ts` (the command) and `src/node/scaffold/` (member kinds)
- `packages/developer/cli/src/node/functions/service-example-module.function.ts` and the template's `services/example/src/modules/notes/` (the shape a module takes)
- `@stackra/gen`: `build-manifest` (`permission_unknown`, `action_risk_below_write`, the prefix checks), `check-call-shape` (`idempotency_missing`, `query_above_l1`, `step_up_missing`), `check-model-scope` (`model_tenancy_missing`, `model_tenancy_migration_missing`), `derive-endpoint`, `table-name`, `permission-key`, `PUBLIC_ID_PREFIXES`, `generated_dependency_missing`
- ADR 0282 decision 3; ADR 0294 decisions 13, 20 and 21; ADR 0305 rules 11 and 15; ADR 0159 as amended; ADR 0239 decision 1; ADR 0135 rule 2; ADR 0099 and STA-2096; ADR 0136; ADR 0128

## Impact

- **Apps touched**: apps/docs (the CLI page and the scaffolding guide)
- **Services touched**: none
- **Packages touched**: packages/developer/cli (five feature kinds of `stackra new` under `src/node/feature-scaffold/`)
- **Public contract change**: yes, additive: five new kinds and seven new flags of the `stackra new` command (`--member`, `--module`, `--model`, `--fields`, `--prefix`, `--global`, `--table`). No exported type, port or manifest changes; existing kinds behave as before
- **Cross-service events**: none
- **Tenancy and data**: a model scaffolded in a service that runs `@stackra/tenancy` is tenant-owned (`BelongsToTenant`, `t.belongsToTenant()` in its create migration), or global by design with `--global`; nothing reads or writes tenant data
- **Secrets**: none
- **ADR needed**: no new ADR; this implements ADR 0282 decision 3 for the v3 groups of ADR 0294 and 0305
- **New dependencies**: none (the CLI already depends on `@stackra/gen` and `@stackra/support`)
- **Deploy modes**: all; a developer-machine command that writes source files
- **Licence tier**: free (MIT, this repo)
- **Docs to update**: packages/developer/cli README (command table and a Feature pieces section), apps/docs `cli.mdx` and `guides/scaffolding.mdx`, the changeset
- **Lane**: full
- **Change risk**: R1 (a developer command that only writes new files and extends a Permissions class, model or package.json, refusing before writing anything)

## Acceptance criteria

- **AC-001**: WHEN `stackra new module <key>` runs inside a service, THE command SHALL write `src/modules/<key>/` with its first model (the singular of the key, or `--model`), and refuse a module that exists.
- **AC-002**: WHEN `stackra new model <name> --module <key>` runs, THE command SHALL write the model (`HasPublicId` with a prefix free in the shared registry and the service's own models, `Timestamps`, the `--fields`), its create migration at the module's next number with explicit nullability and a comment per column, a PGlite unit test of that migration, its `CrudService`, its view schema, and its Permissions class with `read` at L0 (or add `read` to the one the module has).
- **AC-003**: WHILE the service declares `@stackra/tenancy`, THE model SHALL be tenant-owned (`BelongsToTenant` and `t.belongsToTenant()`), unless `--global` makes it `Model.global`.
- **AC-004**: WHEN `stackra new action <verb>-<model> --module <key>` runs, THE command SHALL write the action (key `<model>.<verb>`, users and agents, `Idempotency.Optional`), its input and output schemas in `schemas/`, and a unit test, and add `static readonly <verb> = Permission.L2` to the model's Permissions class once; `create`, `update` and `delete` SHALL be complete over the model's service, and any other verb SHALL load the row by public id and answer it, with a note naming the file to finish.
- **AC-005**: WHEN `stackra new query <verb>-<model> --module <key>` runs, THE command SHALL write the query, its schemas and a unit test: `get` reads one row by public id and `list` (and any other verb) reads one cursor page newest first, under the model's L0 `read`. A query SHALL always derive `read`: when the model has no Permissions class, the one the command writes SHALL declare `read` at L0, never the query's verb.
- **AC-006**: WHEN `stackra new migration <name> --module <key> --fields ...` runs, THE command SHALL write the module's next migration adding the fields as nullable columns to the model's table (or `--table`), a PGlite test that finds the columns, and the same fields on the model (decorated fields first); it SHALL refuse a `create-` migration, no fields, or a NOT NULL field.
- **AC-007**: THE output of every kind SHALL pass `stackra gen` strict (no refusal, staged codes included), in a plain service and in a tenancy service, and THE command SHALL declare in the service's package.json the packages the new files and gen's wiring import, with the spec the service uses for `@stackra/*`.
- **AC-008**: THE command SHALL refuse before writing anything when a file it would create exists, a name or `--module`/`--model` is not kebab-case, `--table` is not snake_case (`^[a-z][a-z0-9_]*$`), the module or model is missing, or the folder is not a service; `--dry-run` SHALL list the files and change nothing.
- **AC-009**: WHEN the workspace installs oxfmt, THE command SHALL format what it wrote; otherwise it SHALL print a note saying to.

## Compatibility and migration

- Existing kinds and flags are unchanged; the new kinds only answer inside a service.
- A service scaffolded before STA-2794 still has its empty root module, which gen refuses as `empty_module`; that is STA-2794's fix, not this one's.
- **Version bump**: minor (`@stackra/cli`, fixed 0.x group).

## Risks

- The packages gen's wiring imports for these pieces (`@stackra/console`, `@stackra/events`, `@stackra/queue`, and for tenancy `@stackra/actions` and `@stackra/scheduler`) are read from gen's emitters on 2026-11-26; if gen starts importing another package, the scaffold under-declares and gen names it (`generated_dependency_missing`). The gen test catches it in this repo.
- Non-`@stackra` packages are declared as `catalog:` (as `stackra new service --data` does); a product whose catalog lacks them must add them (STA-2839 finding 1).
- Since `@stackra/app` depends on `@stackra/cache` (STA-2803), gen wires the cache contributions into every service and wants `@stackra/cache`, `@stackra/config` and `@stackra/storage` declared; the service template does not declare them yet. The gen test's fixture declares them, so the test still proves what the feature kinds write.

## Open questions

None.

## Amendments

- 2026-11-27 · CTO review conditions: `--table` is validated as snake_case (AC-008); a query always derives `read`, also
  when it writes the model's first Permissions class (AC-005); no internal machine names in the spec or plan.

## Status history

- 2026-11-26 → Clarified (audit item 13.2; gen's rules read from source)
- 2026-11-26 → Planned (plan.md)
- 2026-11-27 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-27
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built and proved on a Linux build host in the same branch)
