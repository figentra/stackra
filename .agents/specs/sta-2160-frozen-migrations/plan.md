# Implementation Plan: locked migrations are frozen by a SHA-256 lock in each service manifest

**Spec**: `.agents/specs/sta-2160-frozen-migrations/spec.md` · **Linear**: STA-2160 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2160-frozen-migrations/spec.md`

## Summary

`compileMigrations` hashes each compiled migration (`migrationSha256`) and returns the lock in apply order; `generate`
writes it to a service's `stackra.manifest.json` as `migrations`. The next run reads the committed section
(`migrationLockOf`, refusing a malformed one), compiles the locked migrations with `frozen` (authoring rules become
`migration_rule_frozen` warnings), judges them (`checkMigrationLock`: changed, missing, gap) and orders them first
(`orderMigrations(units, locked)`). `checkMigrationDrift` (`stackra db diff`) reads the same lock. The manifest-only
pass carries the committed section unchanged, and source modules load under a content-addressed URL so a second
compile in one process sees an edited file.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/gen` (`@stackra/gen`), `packages/data/database` (`@stackra/database`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), temporary service folders for the node tests
- **Storage**: the committed `stackra.manifest.json` (a JSON section), no database
- **Runtime target**: node (gen and the compiler); the lock types and pure checks are isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen already calls `@stackra/database`'s `compileMigration` through its loader |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                    |
| Security                              | PASS   | the lock holds ids and digests only                                           |
| HTTP and events                       | N/A    | no route, header or event changes                                             |
| Tenancy                               | PASS   | protects applied schema history; reads no tenant data                         |
| Delegation                            | PASS   | one session, one branch                                                       |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                        |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                            |
| Versions and catalogs                 | PASS   | no dependency added                                                           |
| Deploy modes (ADR 0076)               | PASS   | development-time only, same in all three                                      |
| Licence tier (ADR 0077)               | PASS   | free                                                                          |
| Docs and ADRs                         | PASS   | ADR 0159 amended 2026-11-26 and a changeset; implements the 2026-10-23 note   |

## Deploy modes

| Mode       | Behaviour                                                    |
| ---------- | ------------------------------------------------------------ |
| SaaS       | gen refuses a changed locked migration before it merges      |
| On-prem    | same; the committed manifest ships the lock with the service |
| Air-gapped | same                                                         |

## Correctness properties

- **P-001**: for every service run with migrations, the written `migrations` section lists exactly the ordered units, each with its `migrationSha256` — Validates: FR-001
- **P-002**: for every locked entry, the run passes only when a unit with that id exists and hashes to the locked digest — Validates: FR-002, FR-003
- **P-003**: for every locked entry, every migration that runs before it (its module's previous one, its `after` ids) is locked — Validates: FR-004
- **P-004**: the ordered output starts with the locked ids in their locked order — Validates: FR-005
- **P-005**: a frozen compile and an unfrozen compile of a rule-abiding migration give the same steps and no warning — Validates: FR-006
- **P-006**: `migrationLockOf` returns no lock only when the section is absent; any other non-conforming value is a refusal — Validates: FR-007
- **P-007**: `migrationSha256` ignores whole lint comment lines and nothing else — Validates: FR-001
- **P-008**: for every committed lock, `stackra db diff` compiles and orders the migrations exactly as `stackra gen` does under the same lock — Validates: FR-008
- **P-009**: for every manifest-only pass the `migrations` section is byte-equal to the committed one, and for every package member no section is written — Validates: FR-009

## Architecture overview

The lock lives where gen already writes its output contract: the service manifest. Reading it is pure
(`migrationLockOf`), judging it is pure (`checkMigrationLock`), and ordering stays pure (`orderMigrations` with the
locked prefix). Hashing is node-only (`migrationSha256`, `node:crypto`). `compileMigrations` ties them: per migration
it passes `frozen` when the id is locked, collects warnings, hashes, checks, orders and returns `lock`. `generate`
substitutes the manifest file's content with the lock for a service; `generateMember` carries the previous section.

## Components and responsibilities

- `LockedMigration` (`gen/src/core/types/locked-migration.type.ts`): `{ id, sha256 }`.
- `migrationLockOf` (`gen/src/core/functions/migration-lock-of.function.ts`): read and validate the section.
- `checkMigrationLock` (`gen/src/core/functions/check-migration-lock.function.ts`): changed, missing and gap refusals.
- `orderMigrations` (`gen/src/core/functions/order-migrations.function.ts`): the locked prefix first.
- `migrationSha256` (`gen/src/node/functions/migration-sha256.function.ts`): the digest.
- `compileMigrations` (`gen/src/node/functions/compile-migrations.function.ts`): frozen compile, warnings, lock.
- `generate` (`gen/src/node/functions/generate.function.ts`): reads the lock for a service, writes the new one.
- `generateMember` (`gen/src/core/functions/generate-member.function.ts`): carries the lock in the manifest-only pass.
- `checkMigrationDrift` (`gen/src/node/functions/check-migration-drift.function.ts`): compiles under the lock.
- `loadSourceModule` (`gen/src/node/functions/load-source-module.function.ts`): content-addressed module URL.
- `compileMigration`, `SchemaRecord.compile`, `BlueprintRecord.compile` (`@stackra/database`): the `frozen` warn path.

## Files and folders

```text
packages/data/database/src/core/
├── functions/
│   ├── compile-migration.function.ts
│   └── __tests__/compile-migration.function.test.ts
├── records/
│   ├── blueprint.record.ts
│   └── schema.record.ts
└── types/
    ├── compile-options.type.ts
    └── compiled-migration.type.ts
packages/developer/gen/
├── package.json
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── __tests__/index.test.ts
    │   ├── functions/
    │   │   ├── check-migration-lock.function.ts
    │   │   ├── migration-lock-of.function.ts
    │   │   ├── order-migrations.function.ts
    │   │   ├── generate-member.function.ts
    │   │   └── __tests__/
    │   └── types/
    │       ├── locked-migration.type.ts
    │       └── migration-unit.type.ts
    └── node/functions/
        ├── migration-sha256.function.ts
        ├── compile-migrations.function.ts
        ├── generate.function.ts
        ├── check-migration-drift.function.ts
        ├── load-source-module.function.ts
        └── __tests__/
apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx
.changeset/frozen-migrations-lock.md
```

- `packages/developer/gen/src/core/functions/check-migration-lock.function.ts`
- `packages/developer/gen/src/core/functions/migration-lock-of.function.ts`
- `packages/developer/gen/src/core/functions/order-migrations.function.ts`
- `packages/developer/gen/src/core/functions/generate-member.function.ts`
- `packages/developer/gen/src/core/types/locked-migration.type.ts`
- `packages/developer/gen/src/core/types/migration-unit.type.ts`
- `packages/developer/gen/src/node/functions/migration-sha256.function.ts`
- `packages/developer/gen/src/node/functions/compile-migrations.function.ts`
- `packages/developer/gen/src/node/functions/generate.function.ts`
- `packages/developer/gen/src/node/functions/check-migration-drift.function.ts`
- `packages/developer/gen/src/node/functions/load-source-module.function.ts`
- `packages/data/database/src/core/functions/compile-migration.function.ts`
- `packages/data/database/src/core/records/blueprint.record.ts`, `packages/data/database/src/core/records/schema.record.ts`
- `packages/data/database/src/core/types/compile-options.type.ts`, `packages/data/database/src/core/types/compiled-migration.type.ts`

## Data models and migrations

The manifest section, written by gen:

```json
{ "migrations": [{ "id": "billing.0001_create_invoices", "sha256": "<64 lowercase hex>" }] }
```

No database migration.

## Contracts

- `@stackra/gen`: `checkMigrationLock(locked, units): GenError[]`; `migrationLockOf(manifest): { locked, errors }`;
  type `LockedMigration { id; sha256 }`; `MigrationUnit.sha256?: string`; `orderMigrations(units, locked = [])`.
- `@stackra/database`: `CompileOptions.frozen?: boolean`; `CompiledMigration.warnings?: readonly string[]`.
- Gen codes: `migration_locked_changed`, `migration_locked_missing`, `migration_lock_gap`, `migration_lock_malformed`
  (errors); `migration_rule_frozen` (warning).
- Callers: `stackra gen`, `stackra gen --check` and `stackra db diff` through `@stackra/cli`; no call site changes.

## Error handling

Every refusal is a `GenError` with a file, subject, message and fix; a refused run writes nothing. A frozen
authoring-rule breach is a warning (`severity: "warning"`), never silent. A malformed lock is an error, never an empty
lock.

## Security and tenancy

The lock carries ids and digests. Freezing applied SQL prevents a schema drift between environments; no tenant data
is read.

## Testing strategy

- AC-001: `generate.function.test.ts` ("locks a service's migrations in its manifest…", "reports a service manifest
  without its lock as stale…"), `compile-migrations.function.test.ts` ("returns the lock…").
- AC-002: `check-migration-lock.function.test.ts` (changed, gone, module gap, `after` gap),
  `compile-migrations.function.test.ts` ("refuses a locked migration whose source changed…", "…that is gone", "a lock
  whose migrations are all gone").
- AC-003: `order-migrations.function.test.ts` ("with a locked prefix"), `compile-migrations.function.test.ts` ("keeps
  passing it when a new migration is added after").
- AC-004: `compile-migration.function.test.ts` ("of a frozen migration"), `compile-migrations.function.test.ts`
  ("still compiles a locked migration a newer rule would refuse…", "applies every rule to a migration the lock does
  not name").
- AC-005: `migration-lock-of.function.test.ts`, `check-migration-drift.function.test.ts` ("refuses a malformed lock"),
  `generate.function.test.ts`.
- AC-006: `generate.function.test.ts` ("checks a package's own migrations but locks none…"),
  `generate-member.function.test.ts`.
- EC-05, EC-06: `load-source-module.function.test.ts`, `migration-sha256.function.test.ts`.

## Rollout

Minor changesets for `@stackra/gen` and `@stackra/database`. Each service runs `stackra gen` once and commits its
manifest; `stackra gen --check` in CI reports any service that has not.

## Delegation and risk plan

One session, one branch (PR #1123). Change risk R2. No follow-up required by this spec.

## ADRs

ADR 0159 (decisions 1 to 4, the 2026-10-23 note; amended 2026-11-26 by this PR): Accepted. The leader's decision of
2026-11-06 (os 0.14 migration, decision 5).

## Docs

`apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx`, `.changeset/frozen-migrations-lock.md`.

## Complexity tracking

none

## Follow-up

Packages are checked but not locked today. STA-2885 locks a package's released migrations too and refuses a changed package migration the same way as a service one (CTO note at approval, 26 Nov).
