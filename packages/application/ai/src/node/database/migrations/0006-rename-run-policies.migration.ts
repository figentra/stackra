/**
 * Stackra file contract:
 * Purpose: the sixth migration of the ai package (`ai.0006_rename_run_policies`): names the tenant policies of
 *          `ai.run_steps` and `ai.run_approvals` after their tables (`pol_run_steps_tenant_id`,
 *          `pol_run_approvals_tenant_id`), the names `t.belongsToTenant()` gives and `assertRowSecurity` checks.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. 0005 renamed the tables `steps` and `approvals`, and a table rename keeps its policies' names, so
 *           they stayed `pol_steps_tenant_id` and `pol_approvals_tenant_id`; a host's generated tenant-isolation test
 *           then read each as a missing policy plus a second permissive one. `alter policy … rename to` keeps the
 *           predicate and the policy itself, so no moment passes without one. No `down()`: each rename states its own
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots); ADR 0160 (raw SQL with a reason); ADR 0100 (the ai tables);
 *                     ADR 0347 (tenant policies); STA-2577.
 */
import { Migration, type SchemaBuilder } from "@stackra/database";

/** Renames the two policies 0005's table renames left behind. */
export class RenameRunPoliciesMigration extends Migration {
  /** Two policy renames, in place. */
  up(schema: SchemaBuilder): void {
    // raw-sql: the blueprint has no policy rename; each statement states its inverse
    schema.sql(
      'alter policy "pol_steps_tenant_id" on "ai"."run_steps" rename to "pol_run_steps_tenant_id"',
      {
        inverse:
          'alter policy "pol_run_steps_tenant_id" on "ai"."run_steps" rename to "pol_steps_tenant_id"',
      },
    );
    // raw-sql: same reason as above
    schema.sql(
      'alter policy "pol_approvals_tenant_id" on "ai"."run_approvals" rename to "pol_run_approvals_tenant_id"',
      {
        inverse:
          'alter policy "pol_run_approvals_tenant_id" on "ai"."run_approvals" rename to "pol_approvals_tenant_id"',
      },
    );
  }
}
