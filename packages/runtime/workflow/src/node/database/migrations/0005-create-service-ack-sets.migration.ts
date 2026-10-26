/**
 * Stackra file contract:
 * Purpose: the fifth migration of the workflow package: `workflow.service_ack_sets`, the acks a workflow waits for on
 *          one subject.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. Platform data like the journal: no row-level-security policy. No `down()`: gen derives the dev
 *           inverse.
 * Runtime: node
 * Governing contract: ADR 0210 (decision 6); ADR 0427 (decision 1); ADR 0159 (as amended); R-16 (every column has a
 *                     comment and its nullability).
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the ack-set table. */
export class CreateServiceAckSetsMigration extends Migration {
  /** The table and its unique subject. */
  up(schema: SchemaBuilder): void {
    schema.create("service_ack_sets", (t: Blueprint) => {
      t.hasPublicId("wfk");
      t.timestamps();
      t.versioned();
      t.string("subject", 255)
        .notNull()
        .comment("What the acks are for, such as a tenant's public id.");
      t.jsonb("expected").notNull().comment("The member keys of the services expected to ack.");
      t.jsonb("acked").notNull().comment("The member keys of the services that acked so far.");
      t.timestamp("completed_at")
        .nullable()
        .comment("When the last expected service acked; null while one is missing.");
      t.unique(["subject"]);
    });
  }
}
