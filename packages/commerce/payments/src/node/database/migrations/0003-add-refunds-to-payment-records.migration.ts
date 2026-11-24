/**
 * Stackra file contract:
 * Purpose: the third migration of the payments package (`payments.0003_add_refunds_to_payment_records`): the expand step
 *          that gives `payment_records` a nullable `refunds` column, where the refunds the provider accepted are kept under
 *          their idempotency reference, so a retried refund is answered with the first answer and counted once.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a literal.
 *           One nullable jsonb column with no default, so no table rewrite and the table's tenant policy is untouched; older
 *           rows stay null (no refund remembered, as before). No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: expand and contract); ADR 0357 (decision 5); ADR 0239.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Adds the accepted refunds to the payment records. */
export class AddRefundsToPaymentRecordsMigration extends Migration {
  /** One nullable jsonb column. */
  up(schema: SchemaBuilder): void {
    schema.table("payment_records", (t: Blueprint) => {
      t.jsonb("refunds")
        .nullable()
        .comment(
          "The refunds the provider accepted, each with its idempotency reference, amount, provider id and state; null when none.",
        );
    });
  }
}
