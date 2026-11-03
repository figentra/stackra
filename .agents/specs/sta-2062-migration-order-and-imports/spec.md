# Feature Specification: gen orders migrations by module dependency and macro use, checks their imports, and merges a service's own macros into Blueprint

**Feature Branch**: `figentra/sta-2062-migration-order-and-imports`

**Created**: 2026-11-03

**Status**: Planned

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2062

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-13 of the gen coverage audit, gaps G-89, G-90 and G-191. Migrations are
ordered by module dependency and by the edges macro calls imply (ai after tenancy); a migration that imports anything
but `@stackra/database` or `#stackra/migrations` is refused; a service's own macro type-checks through a merged
`Blueprint` augmentation that gen writes."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none in this repository (`services/example` and `services/health` have no migrations). A
  product service whose modules were out of dependency order gets its `.stackra/migrations` files in a new order on its
  next gen.
- **Packages touched**: packages/developer/gen
- **Public contract change**: additive: a service with its own `database/macros/*.macro.ts` gets the generated
  `.stackra/gen/blueprint.ts`; the new refusal code `migration_import_forbidden`. The order of `.stackra/migrations`
  changes only where today's order breaks a module or macro dependency.
- **Cross-service events**: none
- **Tenancy and data**: none new. The order fix puts a tenancy-macro caller (the ai package) after tenancy's own
  migrations, which is the order its row-level-security policy already assumes.
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no. This implements ADR 0159 as amended by ADR 0294 (modules in dependency order, then by number) and
  by ADR 0305 (the edges macros imply; a migration imports only `@stackra/database` and `#stackra/migrations`), and the
  `Blueprint` merge that `blueprint.type.ts` and `macro.base.ts` already describe.
- **New dependencies**: none (gen already depends on `typescript6`, whose `preProcessFile` reads the imports)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/developer/gen/README.md (the `.stackra/migrations` row and a `.stackra/gen/blueprint.ts`
  row)
- **Lane**: lite
- **Change risk**: R1 (one member, generated output only)

## Clarifications

### Session 2026-11-03

- Q: What does "a module depends on" mean for migrations? → A: The edges gen already derives. A declared package's
  module depends on the loaded modules of the packages its own `package.json` `dependencies` name (compile-migrations
  already reads that file for macros). A member's own module depends on every loaded package module the member
  declares, and on its sibling modules through the constructor-dependency edges that `build-manifest` and
  `emit-wiring` already compute (`dependsOn`). Answered from the code; no owner decision.
- Q: How does gen know which macros a migration calls? → A: It records each macro's `apply` call while
  `compileMigration` runs the migration (a same-named subclass per macro), so the edge is exact and needs no change in
  `@stackra/database`. Answered from the code.
- Q: Does the merged augmentation cover package macros too? → A: No. Each package macro ships its own augmentation
  (the four stand-ins in tenancy, iam, access-log and search), imported by the macro file, because a package's built
  `./node` cannot read `.stackra/`. Writing them again would declare the same member twice. Gen writes the members of
  a service's own macros only. Answered from the code.
- Q: Is a type-only import from elsewhere allowed in a migration? → A: No. ADR 0159's 0305 note says a migration
  imports only the two specifiers; all 66 migrations in this repository already comply.

## Glossary _(full lane)_

- **Module edge**: module A's migrations run after every loaded migration of module B.
- **Macro edge**: a migration that calls a macro owned by another module runs after that module's last loaded
  migration.
- **Merged augmentation**: `.stackra/gen/blueprint.ts`, one `declare module "@stackra/database" { interface Blueprint
{ ... } }` with one member per own macro, typed from that macro's `apply` parameters.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Migrations apply in dependency order (Priority: P1)

A service declares `@stackra/ai` and `@stackra/tenancy`. Gen writes `.stackra/migrations` with tenancy's migrations
before ai's, because ai depends on tenancy and calls its `t.belongsToTenant()` macro.

**Why this priority**: today ai's tables are created before the tenancy functions their policies rely on; an apply on a
fresh database fails or depends on luck of the alphabet.

**Independent Test**: `orderMigrations` with ai and tenancy units and their needs returns tenancy first; a
`compileMigrations` fixture with a package macro returns the same.

**Acceptance Scenarios**:

1. **Given** ai's migration needs the tenancy module, **When** gen orders them, **Then** every tenancy migration comes
   before it.
2. **Given** an own module `billing` whose classes depend on module `tenants`, **When** gen orders them, **Then**
   `tenants` migrations come first although `billing` sorts first by name.

---

### User Story 2 - A migration that imports anything else is refused (Priority: P1)

A developer imports a model or a helper into a migration. Gen refuses it with `migration_import_forbidden`, naming the
file and the specifier, before it loads the file.

**Why this priority**: a migration is a frozen snapshot; an import of live code rewrites history when that code changes.

**Independent Test**: a `compileMigrations` fixture whose migration imports `#modules/billing/models/invoice.model`
returns the refusal and no files.

**Acceptance Scenarios**:

1. **Given** a migration importing `@stackra/database` only, **When** gen compiles, **Then** no import refusal.
2. **Given** a migration with `import type { X } from "../models/x.model"`, **When** gen compiles, **Then**
   `migration_import_forbidden` names that specifier.

---

### User Story 3 - A service's own macro type-checks (Priority: P1)

A service writes `src/modules/compliance/database/macros/retention.macro.ts` and calls `t.retention("kept_until")` in
its migration. Gen writes `.stackra/gen/blueprint.ts`, so the call type-checks and a wrong argument does not.

**Why this priority**: without it a service's own macro is unusable from TypeScript.

**Independent Test**: a type-check of a fixture program with the generated file accepts the right call and rejects a
wrong one.

**Acceptance Scenarios**:

1. **Given** an own macro `RetentionMacro` with `apply(t: Blueprint, column: string)`, **When** gen runs, **Then**
   `.stackra/gen/blueprint.ts` declares `retention` with the parameters `[column: string]`.
2. **Given** no own macro, **When** gen runs, **Then** no `.stackra/gen/blueprint.ts` is written.

### Edge Cases

- **EC-01**: A needed module has no loaded migrations (a package with macros and no migrations): no edge, no refusal.
- **EC-02**: A migration calls a macro of its own module: no edge (the number order already holds).
- **EC-03**: Module and `after` edges contradict each other: the existing `migration_cycle` refusal names the
  migrations.
- **EC-04**: A package's migration imports something else: refused like an own one, naming the package file.
- **EC-05**: A dynamic `import()` or a re-export (`export ... from`) counts as an import.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN a migration's module depends on another loaded module THE `orderMigrations` function SHALL place it
  after every migration of that module.
- **FR-002**: WHEN a migration calls a macro owned by another module THE gen SHALL place it after every loaded
  migration of that module.
- **FR-003**: THE gen SHALL derive module dependencies from a package's `package.json` dependencies, from the packages
  a member declares, and from the member's own module `dependsOn` edges.
- **FR-004**: IF a migration file imports a specifier other than `@stackra/database` or `#stackra/migrations` THEN THE
  gen SHALL refuse it with `migration_import_forbidden`, naming the file and the specifier, without loading it.
- **FR-005**: WHEN a service has own macros THE gen SHALL write `.stackra/gen/blueprint.ts`, one `Blueprint` member
  per own macro, named as the compiler installs it and typed from the macro's `apply` parameters.
- **FR-006**: WHEN no edge decides between two ready migrations THE order SHALL stay as today: packages first, then by
  id.

### Key Entities _(include if feature involves data)_

- **MigrationUnit**: gains `needs`, the module keys whose migrations must all run first (module and macro edges).

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a module depends on another module THE gen SHALL write that module's migrations after those of the
  module it depends on.
- **AC-002**: WHEN a migration calls a macro of another module THE gen SHALL write it after that module's migrations
  (ai after tenancy).
- **AC-003**: IF a migration imports anything but `@stackra/database` or `#stackra/migrations` THEN THE gen SHALL refuse
  it with `migration_import_forbidden`.
- **AC-004**: WHEN a service declares its own macro THE gen SHALL write a merged `Blueprint` augmentation through which
  the macro's call type-checks.

## Success Criteria _(mandatory)_

- **SC-001**: The ai-after-tenancy case and an own-module dependency order correctly — verified by: unit
  (`order-migrations.function.test.ts`, `compile-migrations.function.test.ts`)
- **SC-002**: A forbidden import is refused before load — verified by: unit (`compile-migrations.function.test.ts`)
- **SC-003**: An own macro call type-checks and a wrong one does not — verified by: unit (a TypeScript program in
  `compile-migrations.function.test.ts`)
- **SC-004**: `pnpm verify` stays green for gen and the repository's 66 migrations — verified by: ci-box run

## Out of scope

- Typed `#stackra/migrations` ids and locking migration ids and step hashes (wp-52, G-91 and G-87).
- Replacing the four package stand-in augmentations: a package's built `./node` cannot read `.stackra/`.
- Checking a macro file's imports (the existing `migration_load_failed` hint stays).

## Assumptions

- No production database has applied a host's migrations in an order this fix changes; ADR 0159 freezes an applied
  migration, and dev and preview databases are rebuilt from `.stackra/migrations`.
- A macro class is named `<Name>Macro` in `<name>.macro.ts`, as `BlueprintRecord` already requires.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (gen-100 wp-13) · created
- 2026-11-03 · Draft → Clarified · Claude (gen-100 wp-13) · questions answered from the code and ADR 0159
- 2026-11-03 · Clarified → Planned · Claude (gen-100 wp-13) · plan.md and tasks.md written; Tasked waits on the
  leader's approval of the plan
