/**
 * Stackra file contract:
 * Purpose: `emitEncoreDatabase`, a service's Encore database declaration (`.stackra/encore/<member>/database.ts`):
 *          one `SQLDatabase` named after the member (snake case), whose migrations are the compiled
 *          `.stackra/migrations` folder (`MIGRATIONS_DIR`, stackra-248), so Encore provisions the service's own logical
 *          database and applies its migrations. `#stackra/boot` connects with its `connectionString`.
 * Boundary: pure; written only for a service with a database (`usesDatabase`). The connection string is Encore's at
 *           run time, never read or logged here. Replicas are not an Encore declaration: the boot reads them from the
 *           runtime (`DATABASE_REPLICA_URLS`).
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (decisions 1 to 3: one logical database and role per service, enforced here); ADR 0159
 *                     (the compiled migration stream); ADR 0091 (decision 2: gen emits the whole Encore app); stackra-250.
 */
import { snakeCase } from "@stackra/support";

import { MIGRATIONS_DIR } from "#core/constants/migrations-dir.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { usesDatabase } from "#core/functions/uses-database.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore database file of a service, or undefined when it has no database.
 *
 * @example
 * emitEncoreDatabase(commerceIr)?.path; // ".stackra/encore/commerce/database.ts"
 */
export function emitEncoreDatabase(ir: MemberIR): GeneratedFile | undefined {
  if (!usesDatabase(ir)) return undefined;
  const header = generatedHeader({
    from: "package.json and the models under src/",
    purpose: `the logical database of ${ir.package}, provisioned by Encore with the compiled migrations.`,
    boundary:
      "the one database of this service (ADR 0238); `#stackra/boot` connects with its connection string, and no " +
      "other service reads it.",
    runtime: "node",
  });
  return {
    path: `.stackra/encore/${ir.member}/database.ts`,
    content: [
      header,
      'import { SQLDatabase } from "encore.dev/storage/sqldb";',
      "",
      "/** The service's own database; Encore applies the `.up.sql` files in order. */",
      `export const database = new SQLDatabase(${JSON.stringify(snakeCase(ir.member))}, {`,
      // Relative to this file, two folders under the member root.
      `  migrations: ${JSON.stringify(`../../${MIGRATIONS_DIR.slice(".stackra/".length)}`)},`,
      "});",
      "",
    ].join("\n"),
  };
}
