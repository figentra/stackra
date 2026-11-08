/**
 * Stackra file contract:
 * Purpose: the seventh migration of the database package (`database.0007_contract_isolation_scope`): the contract step
 *          of `database.0006_add_isolation_scope`. `sequence_counters`, `sequence_blocks`, `sequence_voids` and
 *          `projection_rows` make `isolation_scope_id` NOT NULL, take `pol_<table>_isolation_scope_id` (equality with
 *          `app.tenant_id`) as their one permissive policy, and keep the scope path as a restrictive narrowing.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. It first refuses, before any change, while a row of the four tables has a null
 *           `isolation_scope_id`, naming each table's count: such an environment runs the backfill first. `scope_id`
 *           stays the caller's sub-scope and part of each key. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, item 3); ADR 0347 (decisions 1 to 3); ADR 0323 (decision 1);
 *                     ADR 0159 (as amended: expand and contract).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** The scope-path policy each table had since it was created, now a restrictive narrowing. */
const SCOPE_PATHS = { setting: "app.scope_paths", match: "ancestor" } as const;

/** The isolation equality, the one permissive policy. */
const ISOLATION = { setting: "app.tenant_id", match: "equals" } as const;

/** What an environment refused by the pre-flight runs first. */
const REMEDY =
  "Backfill isolation_scope_id in this environment first (the RUNWAY 4c backfill, run per environment), then migrate again.";

/** Makes the isolation's scope node the owner of the sequence and projection tables. */
export class ContractIsolationScopeMigration extends Migration {
  /** The pre-flight, then per table: NOT NULL, the equality policy and the scope path restrictive. */
  up(schema: SchemaBuilder): void {
    schema.refuseNulls(
      "isolation_scope_id",
      ["sequence_counters", "sequence_blocks", "sequence_voids", "projection_rows"],
      REMEDY,
    );
    schema.table("sequence_counters", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.change("isolation_scope_id").notNull();
      t.rowLevelSecurity("isolation_scope_id", ISOLATION);
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("sequence_blocks", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.change("isolation_scope_id").notNull();
      t.rowLevelSecurity("isolation_scope_id", ISOLATION);
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("sequence_voids", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.change("isolation_scope_id").notNull();
      t.rowLevelSecurity("isolation_scope_id", ISOLATION);
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
    schema.table("projection_rows", (t: Blueprint) => {
      t.dropRowLevelSecurity("scope_path", SCOPE_PATHS);
      t.change("isolation_scope_id").notNull();
      t.rowLevelSecurity("isolation_scope_id", ISOLATION);
      t.rowLevelSecurity("scope_path", { ...SCOPE_PATHS, restrictive: true });
    });
  }
}
