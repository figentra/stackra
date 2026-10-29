/**
 * Stackra file contract:
 * Purpose: the second migration of the database package (`database.0002_create_action_store_tables`): the tables
 *          behind the durable Postgres drivers of `@stackra/actions`' two hot-path ports. `idempotency_keys` holds each
 *          scoped Idempotency-Key with the fingerprint of its input and, once done, its output, until it expires;
 *          `rate_limit_buckets` holds each token bucket's tokens (in thousandths) and the time they were counted.
 * Boundary: a frozen snapshot, never edited once on main: it imports only this package's own migration API and every
 *           name is a literal. No row-level security: the action pipeline claims a key before the call's scope
 *           session opens, and every key it writes is already scoped (action, tenant, actor, key), so a row is
 *           found only by the call that owns it. An expired row is replaced by the next claim of its key and swept
 *           by later claims through the `expires_at` index. No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 3: key, payload hash and result, 24 hours); ADR 0217 (decision 2: token
 *                     buckets); ADR 0396 (decision 2); ADR 0159 (as amended).
 */
import { Migration, type Blueprint, type SchemaBuilder } from "@stackra/database";

/** Creates the idempotency and rate-limit tables. */
export class CreateActionStoreTablesMigration extends Migration {
  /** The two tables, each keyed by the scoped key the pipeline builds. */
  up(schema: SchemaBuilder): void {
    schema.create("idempotency_keys", (t: Blueprint) => {
      t.timestamps();
      t.string("key", 600)
        .notNull()
        .comment("The scoped Idempotency-Key: action key, tenant, actor and the caller's key.");
      t.string("fingerprint", 64)
        .notNull()
        .comment("The SHA-256 of the call's identity and input, hex.");
      t.boolean("done")
        .notNull()
        .default(false)
        .comment("Whether the first call with the key succeeded.");
      t.jsonb("output")
        .nullable()
        .comment("The first call's output, replayed to every later call; null while it runs.");
      t.timestamp("expires_at").notNull().comment("When the key may be claimed again.");
      t.primary(["key"]);
      t.index(["expires_at"]);
    });
    schema.create("rate_limit_buckets", (t: Blueprint) => {
      t.timestamps();
      t.string("key", 600)
        .notNull()
        .comment("The bucket's key: an API area or a rate-limited action, and the caller.");
      t.integer("millitokens")
        .notNull()
        .comment("The tokens left at refilled_at, in thousandths of a token.");
      t.timestamp("refilled_at").notNull().comment("When the tokens were last counted.");
      t.timestamp("expires_at")
        .nullable()
        .comment("When the bucket is full again and the row may go; null when it never refills.");
      t.primary(["key"]);
      t.index(["expires_at"]);
    });
  }
}
