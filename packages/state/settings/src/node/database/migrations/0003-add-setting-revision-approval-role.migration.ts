/**
 * Stackra file contract:
 * Purpose: the third migration of the settings package (`settings.0003_add_setting_revision_approval_role`): the role
 *          a pending revision's approver must hold, for a role-gated key (`approval: { by: SystemRole.Owner }`).
 * Boundary: a frozen snapshot, never edited once on main: it imports only the migration API and every name is a
 *           literal. An additive, nullable column with no default, so no table rewrite and every older row reads as
 *           four-eyes or no approval. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decisions 4 and 9); ADR 0159 (additive step).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the approving role to the revisions table. */
export class AddSettingRevisionApprovalRoleMigration extends Migration {
  /** One nullable column. */
  up(schema: SchemaBuilder): void {
    schema.table("stored_setting_revisions", (t: Blueprint) => {
      t.string("approval_role", 32)
        .nullable()
        .comment(
          "The role the approver must hold, for a role-gated key; null for four-eyes or none.",
        );
    });
  }
}
