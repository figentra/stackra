/**
 * Stackra file contract:
 * Purpose: the first table of the consent package, `consent.consent_proof_entries`, with its per-subject hash-chain
 *          columns, the forced tenant policy, no UPDATE for the service's sessions, and the trigger that refuses an
 *          UPDATE from any role.
 * Boundary: a frozen snapshot of `consent.consent_proof_entry`, never edited once on main: it imports only
 *           @stackra/database and every name is a literal. Every column states its nullability and a comment equal to
 *           the model field's docblock. The partner macro `belongsToTenant` (@stackra/tenancy: the tenant column, its
 *           index and the forced equality policy `pol_consent_proof_entries_tenant_id`) writes the tenant conventions;
 *           `appendOnly` revokes UPDATE from the service's role; the trigger binds every role (an owner or a superuser
 *           too), raw SQL through `schema.sql` with its inverse, qualified by the package's own schema. The unique
 *           (tenant, subject, sequence) index keeps each subject's chain linear. Inserts, reads and the owning
 *           service's retention DELETE are untouched. No `down()`: gen derives the rest of the dev inverse, and
 *           production is forward only.
 * Runtime: node
 * Governing contract: ADR 0159 (as amended: snapshots, partner macros, comments and nullability, `schema.sql` with
 *                     `inverse`); ADR 0212 (decision 3: append-only storage, a hash chain); ADR 0454 (decision 5);
 *                     ADR 0239; ADR 0231 (index and constraint names); ADR 0294 (decisions 13 and 20); STA-1413
 *                     (`t.appendOnly()`); STA-2818.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the consent proof table. */
export class CreateConsentProofEntriesMigration extends Migration {
  /** The table with its policy, indexes and no UPDATE, then the function and trigger that refuse an UPDATE. */
  up(schema: SchemaBuilder): void {
    schema.create("consent_proof_entries", (t: Blueprint) => {
      t.hasPublicId("cpf");
      t.belongsToTenant();
      t.string("subject", 64)
        .notNull()
        .comment("The public id of the person the consent is about.");
      t.string("given_by", 64)
        .notNull()
        .comment("The public id of who gave it: the subject, or the person acting for them.");
      t.string("relationship", 64)
        .nullable()
        .comment(
          "How the giver stands to the subject when it is someone else; null when the subject answered.",
        );
      t.string("document", 100).notNull().comment("The document or purpose key.");
      t.string("version", 64).notNull().comment("The document version answered.");
      t.string("content_hash", 128)
        .nullable()
        .comment("The hash of the exact text shown; null when the document has none.");
      t.boolean("granted").notNull().comment("Whether the person agreed.");
      t.timestamp("at").notNull().comment("When the answer was given.");
      t.string("channel", 64)
        .nullable()
        .comment("Where it was given; null when the caller did not say.");
      t.string("verification_method", 32)
        .nullable()
        .comment("The verification method the consent passed; null when none was required.");
      t.string("verification_reference", 200)
        .nullable()
        .comment("The verifier's id of that check; null when it gave none.");
      t.integer("sequence")
        .notNull()
        .comment("The proof's position in its subject's hash chain, from 1.");
      t.string("previous_hash", 64)
        .notNull()
        .comment("The hash of the proof before it in the chain.");
      t.string("hash", 64)
        .notNull()
        .comment("SHA-256 of the previous hash, the sequence and the proof.");
      t.unique(["tenant_id", "subject", "sequence"]);
      t.index(["tenant_id", "subject", "document"]);
      t.appendOnly();
    });
    schema.sql(
      `create function "consent"."refuse_update"() returns trigger language plpgsql as $$
begin
  raise exception 'consent.consent_proof_entries is append-only';
end $$`,
      { inverse: 'drop function if exists "consent"."refuse_update"()' },
    );
    schema.sql(
      'create trigger "trg_consent_proof_entries_refuse_update" before update on "consent"."consent_proof_entries" ' +
        'for each row execute function "consent"."refuse_update"()',
      {
        inverse:
          'drop trigger if exists "trg_consent_proof_entries_refuse_update" on "consent"."consent_proof_entries"',
      },
    );
  }
}
