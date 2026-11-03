# Implementation Plan: gen orders migrations by module dependency and macro use, checks their imports, and merges own macros into Blueprint

**Spec**: `.agents/specs/sta-2062-migration-order-and-imports/spec.md` · **Linear**: STA-2062 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2062-migration-order-and-imports/spec.md`

## Summary

`orderMigrations` learns one more kind of edge: a unit's `needs`, the modules whose migrations must all run first.
`compileMigrations` fills `needs` from module dependencies and from the macros a migration actually calls, refuses a
migration whose imports leave the two allowed specifiers, and returns `.stackra/gen/blueprint.ts` for a service with
its own macros.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`, category developer)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none (gen writes SQL files; no migration of its own)
- **Runtime target**: a library (the gen compiler, run by `stackra gen`)

## Constitution Check

| Law                                   | Result | Note                                                        |
| ------------------------------------- | ------ | ----------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen only; no new import of another package                  |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                  |
| Security                              | N/A    | build-time code generation, no runtime surface              |
| HTTP and events                       | N/A    | no endpoint or event                                        |
| Tenancy                               | PASS   | ai's tenant policies now follow tenancy's migrations        |
| Delegation                            | PASS   | one session, one member                                     |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                      |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside their subjects                 |
| Versions and catalogs                 | PASS   | no dependency or catalog change; `typescript6` already used |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                           |
| Licence tier (ADR 0077)               | PASS   | free, this repository                                       |
| Docs and ADRs                         | PASS   | gen README rows; no ADR needed (implements ADR 0159 notes)  |

## Deploy modes

| Mode       | Behaviour                                    |
| ---------- | -------------------------------------------- |
| SaaS       | same SQL files, now in dependency order      |
| On-prem    | same; the pre-upgrade job applies that order |
| Air-gapped | same; gen runs at build time with no network |

## Correctness properties

- **P-001**: Validates: FR-001, FR-002 — For every unit U and module M in U's `needs` (M not U's module), every loaded unit of M precedes U in the order.
- **P-002**: Validates: FR-002, FR-003 — The needs of a unit are exactly its module's dependencies plus the owners of the macros its `up` called, minus its own module.
- **P-003**: Validates: FR-004 — A migration whose source names any import specifier outside `{@stackra/database, #stackra/migrations}` yields `migration_import_forbidden` and is never imported.
- **P-004**: Validates: FR-005 — The merged augmentation declares exactly one member per own macro, named as `BlueprintRecord` installs it, whose parameters are the macro's `apply` parameters after `t`.
- **P-005**: Validates: FR-006 — With no `needs`, the order equals today's.

## Architecture overview

`generate` and `checkMigrationDrift` call `compileMigrations(root, ir)` (node). It finds migration and macro files,
loads macros, loads and compiles each migration, then calls the pure `orderMigrations(units)` and `emitMigrations`.
This change adds three steps inside `compileMigrations` and one input to `orderMigrations`:

1. Before loading a migration: read its text, list its import specifiers with `typescript6`'s `preProcessFile`
   (imports, re-exports, `import()`), refuse any other than the two allowed.
2. While compiling it: pass each macro as a same-named subclass whose `apply` records the macro's owner module, so
   the unit's `needs` holds the modules whose macros it called.
3. Module needs: a package module needs the loaded modules of its `package.json` dependencies; a member's own module
   needs every loaded package module and its sibling modules from `moduleDependsOn(ir)`.
4. `orderMigrations` adds, for each need, an edge to the last loaded migration of that module (the in-module chain
   carries the rest).
5. For `ir.layout === "service"` with own macros, `emitBlueprintMacros` returns `.stackra/gen/blueprint.ts`, added to
   the returned files.

## Components and responsibilities

- `orderMigrations` (core, changed): reads `unit.needs`; edges to each needed module's last migration; unknown or
  empty modules add nothing; refusals unchanged.
- `MigrationUnit` (core type, changed): optional `needs: readonly string[]`.
- `moduleDependsOn` (core, new): the own-module `dependsOn` edges from `ir.classes` deps, the block `build-manifest`
  and `emit-wiring` each hold today; both switch to it (deletion of the two copies).
- `migrationImports` (core, new): the import specifiers of a source text, through an injected `preProcessFile`, so
  the core stays free of TypeScript; or kept inside `compileMigrations` if it stays under ten lines.
- `emitBlueprintMacros` (core, new): own macro files in, one `GeneratedFile` out (or none).
- `compileMigrations` (node, changed): the import check, owner-tagged macros, the recording subclasses, module needs,
  the blueprint file.

## Files and folders

- `packages/developer/gen/src/core/functions/order-migrations.function.ts` (change)
- `packages/developer/gen/src/core/types/migration-unit.type.ts` (change)
- `packages/developer/gen/src/core/functions/module-depends-on.function.ts` (new)
- `packages/developer/gen/src/core/functions/emit-blueprint-macros.function.ts` (new)
- `packages/developer/gen/src/node/functions/compile-migrations.function.ts` (change)
- `packages/developer/gen/src/core/functions/build-manifest.function.ts`, `emit-wiring.function.ts` (use
  `moduleDependsOn`; the modules section only, away from the policies and boot sections other sessions edit)
- Tests: `src/core/functions/__tests__/order-migrations.function.test.ts` (extend),
  `src/core/functions/__tests__/emit-blueprint-macros.function.test.ts`,
  `src/core/functions/__tests__/module-depends-on.function.test.ts`,
  `src/node/functions/__tests__/compile-migrations.function.test.ts` (new)
- `packages/developer/gen/README.md` (the `.stackra/migrations` row, a `.stackra/gen/blueprint.ts` row)
- `.changeset/sta-2062-migration-order-and-imports.md` (gen patch)

## Data models and migrations

none. Gen's output order changes; no migration file is added or edited.

## Contracts

- Generated file `.stackra/gen/blueprint.ts` (service with own macros):

  ```ts
  import type { ColumnGroup } from "@stackra/database";
  import type { RetentionMacro } from "#modules/compliance/database/macros/retention.macro";

  /** The parameters of a macro's `apply` after the blueprint. */
  type MacroArgs<M> = M extends { apply(t: never, ...args: infer A): ColumnGroup } ? A : never;

  declare module "@stackra/database" {
    interface Blueprint {
      retention: (...args: MacroArgs<RetentionMacro>) => ColumnGroup;
    }
  }
  ```

  The import path follows the reader's `importPathOf` (`#modules/<folder>/...`), which the service template's
  `#modules/*` imports map resolves; the class name is `PascalCase(stem) + "Macro"`.

- Refusal `migration_import_forbidden`: file = the migration, subject = the specifier.
- `MigrationUnit.needs` (internal type of gen's core entry).

## Error handling

- `migration_import_forbidden`: one per forbidden specifier; the file is not loaded; no files are returned, as with
  every migration refusal.
- A contradiction between module, macro and `after` edges surfaces as the existing `migration_cycle`.
- The source read for the import check fails only when the file vanished between listing and reading: reported as
  `migration_load_failed`, as today.

## Security and tenancy

none new. The fix makes ai's `belongsToTenant()` tables follow tenancy's migrations.

## Testing strategy

- AC-001, AC-002: `order-migrations.function.test.ts` (needs edges, missing module, own-module need, tie unchanged);
  `compile-migrations.function.test.ts` with a hermetic fixture member in a temp folder: a fake `@stackra/database`
  (`Migration`, `Macro`, a small `compileMigration` that installs macros and runs `up`), a fake `@stackra/tenancy`
  shipping a migration and a macro through `./node`, and a fake `@stackra/ai` whose migration calls the macro; expects
  tenancy's files before ai's. No workspace dependency is added, so `pnpm-lock.yaml` does not change.
- AC-003: the same fixture with a migration importing `#modules/billing/models/invoice.model`, a type-only import and a
  dynamic `import()`.
- AC-004: `emit-blueprint-macros.function.test.ts` for the text; in `compile-migrations.function.test.ts`, a
  `typescript6` program over the fixture (fake `@stackra/database` typings, the macro, the generated file, a migration)
  has no diagnostics for `t.retention("kept_until")` and one for `t.retention(1)`.
- All runs on ci-box: `pnpm --filter @stackra/gen test`, typecheck, lint, then `pnpm verify`.

## Rollout

No flag. A product service picks the new order on its next gen; if its `.stackra/migrations` were already applied to a
dev or preview database in the old order, that database is rebuilt (production applies none of these yet). Changeset:
gen patch.

## Delegation and risk plan

One session (gen-100 wp-13), one member, about 400 changed lines. Risk: the module edges contradict an existing `after`
in a product repository and gen refuses with `migration_cycle`; the refusal names the migrations, and no `after` exists
in this repository.

## ADRs

ADR 0159 (as amended by 0294 and 0305), ADR 0305 (macros), ADR 0294 (decision 20, module schemas). No draft.

## Docs

`packages/developer/gen/README.md`.

## Complexity tracking

none
