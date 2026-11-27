# Feature Specification: tenant-aware database inspections for the dev MCP, and one Encore path

**Feature Branch**: `figentra/sta-2906-dev-mcp-db-tools`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R3, so the security reviewer reads it too)

**Linear**: STA-2906

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Stackra readiness audit, batch AI1 item AI1.4: "Add tenant-aware db_schema and db_query and keep one Encore
path". Raw SQL through the Encore MCP returns zero rows under row-level security, which pushes agents to turn row-level
security off; the template's `.mcp.yaml` starts a second Encore MCP server, with a hard-coded app id, beside the one
`stackra mcp` already proxies (ADR 0334 rule 8). Wanted: `db_query` in a READ ONLY transaction as the app role with an
explicit tenant and limits, local and testbed only; `db_schema`; `db_migrations_status`.

## Impact

- **Apps touched**: apps/docs (ADR 0334's Enforcement list only)
- **Services touched**: none
- **Packages touched**: packages/data/database (three read-only inspections in `./node`), packages/developer/cli (three commands served as MCP tools, a shared member-database import), packages/developer/mcp (one `.mcp.yaml` rule, README)
- **Public contract change**: additive: `@stackra/database/node` exports `describeSchema`, `queryInScope`, `migrationStatus`, `InspectionRefusedError` and the types `SchemaDescription`, `SchemaTable`, `SchemaColumn`, `SchemaPolicy`, `ScopedQuery`, `ScopedQueryResult`, `MigrationStatus`, `MigrationFileStatus`; the `stackra` binary gains `db:schema`, `db:query <scope> <sql>` and `db:migrations:status` (each `--json`, and the `db_schema`, `db_query`, `db_migrations_status` tools of `stackra mcp`); `@stackra/mcp`'s `.mcp.yaml` rules add the code `separate_encore_server`, so a `.mcp.yaml` with a local `encore mcp` server now fails `stackra mcp sync` (breaking for a repository that still has one; the template drops it in the same batch).
- **Cross-service events**: none
- **Tenancy and data**: reads only. The tenant is named by its scope id (`scope`), in the scope vocabulary of ADR 0323. `queryInScope` sets `app.tenant_id` with `set_config(…, true)` for its own READ ONLY transaction, as the isolation driver does (ADR 0495), and never sets `app.scope_*`; no table, migration or write.
- **Security and privacy**: a developer tool that reads a local or testbed database: refuses every deployed environment and, in dev, a connection off this machine; refuses a role that can bypass row-level security or owns an unforced table; refuses `set_config` in a query; one statement only (extended protocol); always rolled back. The connection string is never printed or returned. `query-in-scope.function.ts` joins the ADR 0495 session-setting allow list (`SESSION_SETTING_ALLOWED`, checked by `stackra validate --repository`) with its reason: it writes `app.tenant_id` transaction-locally in its own rolled-back transaction, with no actor, and `@stackra/database` cannot depend on tenancy.
- **Secrets**: none new. `DATABASE_DIRECT_URL` / `DATABASE_URL` (existing, by name); in local dev the CLI asks `encore db conn-uri` for the local database's string and hands it to the inspection in its environment only.
- **ADR needed**: no (implements ADR 0282 decision 5, "query the local database", and ADR 0334 rule 8; the ADR 0334 Enforcement list is updated)
- **New dependencies**: none
- **Deploy modes**: same in all three: a developer tool for local dev and the testbed; nothing runs in a deployed environment
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal and MCP)
- **Docs to update**: apps/docs/src/docs/adr/0334-final-structure-review-round-up-decided-rules-without-an-adr.mdx, packages/data/database/README.md, packages/data/database/AGENTS.md, packages/developer/mcp/README.md
- **Lane**: full
- **Change risk**: R3 (tenancy: reads tenant rows under row-level security; a developer tool with database access)

## Discovery

- **Current behaviour**: `stackra mcp` serves `manifest`, `new`, `gen`, `validate`, `verify`, `doctor` and the local
  Encore tools as `encore_*` (app id from the root runway). Encore's `query_database` runs as the connection's role
  with no tenant set, so a table under forced row-level security answers no rows. There is no schema or migration-status
  tool. The template's `.mcp.yaml` has a separate `encore` server (`encore mcp run --app=acme-platform`) (SRC-001,
  SRC-002, SRC-003).
- **Topology**: CLI commands are console classes in `packages/developer/cli/src/node/commands/`, listed in `COMMANDS`;
  a command with `tool` becomes an MCP tool through `toolsOf` in `MCP_COMMAND`. Database code the CLI runs is imported
  from the member's own `@stackra/database/node` at run time (`loadDatabaseRunner`), so the CLI holds no MikroORM
  (SRC-004).
- **Dependencies**: a local Encore database (`encore db conn-uri`), or a set `DATABASE_URL`; Postgres for the
  integration tests (Testcontainers in the stackra-demo container) (SRC-005).
- **Ownership**: `@stackra/database`, `@stackra/cli`, `@stackra/mcp` by the core maintainers; ADR 0334 and ADR 0282 by
  the leader.
- **Constraints already decided**: ADR 0282 decision 5 (the local MCP queries the local database); ADR 0334 rule 8 (no
  separate `encore` entry); `.agents/rules/tenancy.md` (two layers; transaction-local `set_config(…, true)`); ADR 0495;
  ADR 0473 decision 3 (session tools use the direct URL); ADR 0097 (MikroORM only in `@stackra/database`).

### Sources

- **SRC-001**: `packages/developer/mcp/src/node/functions/serve-local-mcp.function.ts`, `open-encore-mcp.function.ts` and `src/node/constants/local-tools.constant.ts` on `origin/main` (FR-001 to FR-003, FR-009)
- **SRC-002**: a probe of a running local Encore app on box 2 (`encore db conn-uri example`): the connection role is `encore-admin` (no SUPERUSER, no BYPASSRLS, not the owner), tables are owned by `encore-migrator` with FORCE ROW LEVEL SECURITY and policies on `app.tenant_id` (FR-004, FR-005)
- **SRC-003**: the template's `.mcp.yaml` and `flow.config.json` on `origin/main` of stackra-template; ADR 0334 rule 8 and its Enforcement list (FR-009, FR-010)
- **SRC-004**: `packages/developer/cli/src/node/constants/mcp-command.constant.ts`, `commands.constant.ts`, `functions/load-database-runner.function.ts`; `packages/developer/console/src/core/functions/tools-of.function.ts` on `origin/main` (FR-001 to FR-003, FR-008)
- **SRC-005**: `packages/data/database/src/node/functions/open-migration-session.function.ts`, `migrate.function.ts`, `read-migration-files.function.ts`, `src/testing/use-postgres.ts`; `.agents/rules/tenancy.md` (FR-004 to FR-007)
- **SRC-006**: the readiness audit (batch AI1, item AI1.4) and STA-2906 (all)

## Glossary

- **App role**: the role the app itself connects as (locally Encore's `encore-admin`; deployed, the service's runtime
  role, such as `stackra_app`), which cannot bypass row-level security.
- **Inspection**: one of `describeSchema`, `queryInScope`, `migrationStatus`: a read of a local or testbed database
  through one connection in a READ ONLY transaction that is always rolled back.
- **Testbed**: the disposable test boxes (ADR 0484), whose runs set `STACKRA_ENVIRONMENT=test`.

## User Scenarios & Testing

### User Story 1 - An agent reads a tenant's rows as the app does (Priority: P1)

A coding agent in a Stackra app asks why a note does not show for a tenant. It calls `db_query` with the tenant and a
SELECT, and gets that tenant's rows, read as the app's role, instead of none, without touching row-level security.

**Why this priority**: zero rows under row-level security is what pushes agents to disable it.

**Independent Test**: `database-inspection.int.test.ts` on real Postgres with a FORCE ROW LEVEL SECURITY table.

**Acceptance Scenarios**:

1. **Given** a table with forced row-level security and rows of tenants A and B, **When** `db_query` runs as the app
   role under A, **Then** it answers A's rows only, names the role and tenant, and says whether the limit cut them.
2. **Given** a connection whose role can bypass row-level security, **When** `db_query` runs without `role`, **Then**
   it refuses with `inspection_refused` and names the fix.

### User Story 2 - An agent sees the schema and the migration state (Priority: P2)

The agent calls `db_schema` to see the tables, their policies and whether row-level security is forced, and
`db_migrations_status` to see which migrations are pending or were edited after they ran, without writing anything.

**Why this priority**: the agent needs the shape before it writes a query or a migration.

**Independent Test**: the `describeSchema` and `migrationStatus` cases of `database-inspection.int.test.ts`.

**Acceptance Scenarios**:

1. **Given** the member's database, **When** `db_schema` runs, **Then** each table lists its columns, primary key,
   indexes, row-level security (enabled, forced) and policies, with no system schema.
2. **Given** compiled files and a history ledger with a different checksum for one, **When** `db_migrations_status`
   runs, **Then** it marks that file edited, lists pending files and applied versions no file holds.

### User Story 3 - One Encore path (Priority: P3)

A new app's `.mcp.yaml` has no separate Encore server; the local Encore tools reach agents only through `stackra mcp`
with the app id from runway, and a `.mcp.yaml` that adds one fails.

**Why this priority**: a second server, with a hard-coded id, starts Encore for the wrong app after a rename.

**Independent Test**: `rule-issues.function.test.ts`; the template diff.

**Acceptance Scenarios**:

1. **Given** a `.mcp.yaml` server that runs `encore mcp …`, **When** it is parsed, **Then** it fails with
   `separate_encore_server`; the remote `encore-cloud` server passes.

### Edge Cases

- **EC-01**: `STACKRA_ENVIRONMENT` is `preview`, `staging` or `production`: every inspection refuses before connecting.
- **EC-02**: dev with `DATABASE_URL` pointing at another machine: refused, naming the host and never the URL.
- **EC-03**: dev with no URL set and no local Encore database running: the CLI refuses and says to start `stackra dev`.
- **EC-04**: a query with a second statement after `;`, a `COMMIT`, a write or a data-modifying CTE: fails; nothing is
  written; the transaction is rolled back.
- **EC-05**: a role that owns a table whose row-level security is enabled but not forced: refused.
- **EC-06**: the member's `@stackra/database` predates the inspections: the CLI says to update it.

## Requirements

### Functional Requirements

- **FR-001**: THE `stackra` binary SHALL have `db:schema [--member] [--schema] [--table]`, `db:query <scope> <sql> [--member] [--role] [--limit] [--timeout]` and `db:migrations:status [--member]`, each declared `tool: { readOnly: true }`. Sources: SRC-004
- **FR-002**: THE local MCP (`stackra mcp`) SHALL serve them as `db_schema`, `db_query` (requiring `scope`, the tenant's scope id, and `sql`) and `db_migrations_status`, read-only, from their command definitions. Sources: SRC-001, SRC-004
- **FR-003**: THE commands SHALL run the member's own `@stackra/database/node` (`describeSchema`, `queryInScope`, `migrationStatus`), imported at run time from the member's folder. Sources: SRC-004
- **FR-004**: `queryInScope` SHALL run one query in a READ ONLY transaction, as the connection's role or the `role` given, with `app.tenant_id` set to the tenant by `set_config(…, true)`, a statement timeout and a row limit, and SHALL always roll the transaction back. Sources: SRC-002, SRC-005
- **FR-005**: IF the role the query runs as can bypass row-level security (SUPERUSER or BYPASSRLS, directly or by membership) or owns a table whose row-level security is not forced THEN `queryInScope` SHALL refuse. Sources: SRC-002
- **FR-006**: `describeSchema` SHALL answer every ordinary and partitioned table outside the system schemas with its columns, primary key, indexes, row-level security (enabled, forced) and policies, reading the catalogue only. Sources: SRC-005
- **FR-007**: `migrationStatus` SHALL answer the recorded version and dirty flag, each compiled file as applied or pending and edited when the history ledger recorded another checksum, and the applied versions no file holds, without a lock or a write. Sources: SRC-005
- **FR-008**: IF `STACKRA_ENVIRONMENT` is not `dev` or `test`, or in `dev` the connection's host is not on this machine, THEN every inspection SHALL refuse; WHEN no URL is set in local dev THE CLI SHALL take the member's local Encore database from `encore db conn-uri`. Sources: SRC-002, SRC-004
- **FR-009**: THE `.mcp.yaml` rules SHALL refuse a local server that runs `encore mcp` with the code `separate_encore_server`. Sources: SRC-001, SRC-003
- **FR-010**: THE template's `.mcp.yaml` and `flow.config.json` SHALL have no `encore` server (stackra-template, same batch). Sources: SRC-003

### Non-functional Requirements

- **NFR-001**: THE caller's query SHALL run on the extended protocol (bound parameters), so Postgres parses exactly one statement. Sources: SRC-005
- **NFR-002**: THE connection string SHALL never be printed, returned or put in a refusal; a refusal names a host, a role or an environment. Sources: SRC-006
- **NFR-003**: Every answer SHALL be plain JSON (bigints, dates and bytes as strings), so `--json` and the MCP structured result are the same document. Sources: SRC-004

### Key Entities

- **Inspection session**: one pooled connection, `begin transaction read only`, the inspection's statements, `rollback`.

## Acceptance criteria

- **AC-001**: WHEN `queryInScope` runs as the app role under tenant A on a forced row-level security table THE answer SHALL hold A's rows only, and under a tenant that owns nothing, none.
- **AC-002**: IF the role can bypass row-level security or owns an unforced table THEN `queryInScope` SHALL refuse with `InspectionRefusedError`.
- **AC-003**: WHEN the query writes, calls `nextval`, holds a data-modifying CTE or stacks a second statement (a `COMMIT` included) THE call SHALL fail and the table SHALL keep every row.
- **AC-004**: IF `STACKRA_ENVIRONMENT` is a deployed environment, or a dev URL names another machine, THEN every inspection SHALL refuse before connecting.
- **AC-005**: WHEN `describeSchema` runs THE answer SHALL list each table's columns, primary key, indexes, row-level security and policies, and no system schema.
- **AC-006**: WHEN `migrationStatus` runs THE answer SHALL mark applied, pending and edited files and list missing versions.
- **AC-007**: THE `stackra mcp` tool list SHALL hold `db_schema`, `db_query` and `db_migrations_status`, read-only, and `db_query` SHALL require `scope` and `sql`.
- **AC-008**: WHEN a `.mcp.yaml` server runs `encore mcp` THE parse SHALL fail with `separate_encore_server`, and the template SHALL have no such server.

## Success Criteria

- **SC-001**: on real Postgres with FORCE ROW LEVEL SECURITY, tenant A's query answers 2 of 3 rows and tenant B's 1 — verified by: unit (integration, `database-inspection.int.test.ts`)
- **SC-002**: each guard (tenant, bypass refusal, extended protocol, read-only transaction, local host, `set_config` refusal, Encore rule, conn-uri, MCP tool list) has a test that fails when the guard is removed — verified by: revert check on box 2

## Out of scope

- The scope-tree settings (`app.scope_*`): left unset, which every compiled policy reads as no narrower scope.
- Removing the core repository's own `.mcp.yaml` `encore` entry (`--app=<TODO>`): fflow-managed, not a Stackra app, never read by `stackra mcp sync`.
- The rest of the template's `.mcp.yaml` cleanup (STA-2790, Figentra residue): this change touches only the `encore` entry.
- Moving the inspections onto the Diagnostic contract (STA-2886) or the `toolsOf` rework (STA-2873): they rebase over this.

## Assumptions

- Locally the app connects as Encore's `encore-admin`, which cannot bypass row-level security (probed on box 2); a
  testbed connection that is a superuser passes the service's runtime role as `role`.
- Tenant ids are scope public ids (`app.tenant_id`), as the compiled policies compare them.

## Amendments

None.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the readiness audit item and the built change
- 2026-11-27 · Draft → Clarified · spec author · questions answered from ADR 0282, ADR 0334 and a local Encore probe
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
