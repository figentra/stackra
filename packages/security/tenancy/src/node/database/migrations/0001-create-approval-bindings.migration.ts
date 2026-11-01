/**
 * Stackra file contract:
 * Purpose: the first table of the tenancy package, `tenancy.approval_bindings`: the owning service's record of each call
 *          parked for approval, with the forced tenant policy and no UPDATE.
 * Boundary: a frozen snapshot of `tenancy.approval_binding`, never edited once on main: it imports only @stackra/database
 *           and every name is a literal. Every column states its nullability and a comment equal to the model field's
 *           docblock. The partner macro `belongsToTenant` (this package: the tenant column, its index and the forced
 *           equality policy `pol_approval_bindings_tenant_id`) writes the tenant conventions; `appendOnly` revokes UPDATE
 *           from the service's sessions, so `PruneApprovalBindingsAction`'s DELETE is the only change after the insert.
 *           No `down()`: gen derives the dev inverse, and production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability); ADR 0509 (the
 *                     binding, B1, N7); ADR 0239; ADR 0231 (index and constraint names); ADR 0294 (decisions 13 and 20).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the approval binding table. */
export class CreateApprovalBindingsMigration extends Migration {
  /** The table with its tenant policy, its indexes and no UPDATE. */
  up(schema: SchemaBuilder): void {
    schema.create("approval_bindings", (t: Blueprint) => {
      t.hasPublicId("apr");
      t.belongsToTenant();
      t.jsonb("scope")
        .nullable()
        .comment("The scope node the call acts in; null for a call acting at the tenant itself.");
      t.jsonb("requester")
        .notNull()
        .comment("The requester with the whole onBehalfOf chain, ids only.");
      t.string("key", 200).notNull().comment("The action key with its version.");
      t.string("input_hash", 64)
        .notNull()
        .comment("SHA-256 of the action key and the validated input.");
      t.jsonb("assurance_amr")
        .nullable()
        .comment(
          "The authentication methods references of the requester's token; null when the call had no assurance.",
        );
      t.string("assurance_level", 16)
        .nullable()
        .comment("The strongest assurance level those methods reach; null when none is mapped.");
      t.timestamp("assurance_auth_time")
        .nullable()
        .comment("When the requester last authenticated; null when the token did not say.");
      t.timestamp("requested_at")
        .notNull()
        .comment("When the call was requested, by the owning service's clock.");
      t.timestamp("expires_at")
        .notNull()
        .comment("When the request stops accepting votes, by the owning service's clock.");
      t.integer("approvals").notNull().comment("Distinct approvers needed besides the requester.");
      t.string("permission", 200)
        .nullable()
        .comment(
          "The permission each approver holds; null when only the tenant's rules parked the call.",
        );
      t.string("approver_level", 16)
        .nullable()
        .comment(
          "The assurance level an approver's session must reach; null when none is required.",
        );
      t.boolean("confirm").notNull().comment("Whether the person an agent acts for must confirm.");
      t.string("execute", 16)
        .notNull()
        .comment("How the request executes: on_grant or on_resubmit.");
      t.index(["tenant_id", "expires_at"]);
      t.index(["expires_at"]);
      t.appendOnly();
    });
  }
}
