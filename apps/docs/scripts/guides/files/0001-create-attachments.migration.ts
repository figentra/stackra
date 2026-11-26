/**
 * Stackra file contract:
 * Purpose: the migration of the "Files" guide's attachments: the tenant-owned `attachments` table that records where
 *          each claimed file is stored.
 * Boundary: a frozen snapshot that uses only `@stackra/database` and the tenancy macro; every name is a literal.
 * Runtime: node
 * Governing contract: ADR 0159; ADR 0239; ADR 0222; STA-2843.
 */
import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the attachments table, owned by a tenant. */
export class CreateAttachmentsMigration extends Migration {
  /** The table, its tenant column and policy, and where the file is. */
  up(schema: SchemaBuilder): void {
    schema.create("attachments", (t: Blueprint) => {
      t.hasPublicId("att");
      t.belongsToTenant();
      t.timestamps();
      t.string("name", 200).notNull().comment("The file's name as the customer gave it.");
      t.string("path", 300).notNull().comment("Where the file is stored on the disk.");
      t.string("media_type", 100).notNull().comment("The file's media type.");
      t.integer("size").notNull().comment("The file's size in bytes.");
    });
  }
}
