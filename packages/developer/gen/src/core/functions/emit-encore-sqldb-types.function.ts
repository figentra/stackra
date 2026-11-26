/**
 * Stackra file contract:
 * Purpose: `emitEncoreSqldbTypes`, the type-only `encore.dev/storage/sqldb` module of a service whose boot connects its
 *          database (`.stackra/gen/encore-sqldb.d.ts`, STA-1795): `#stackra/boot` imports the generated
 *          `stackra-encore/<member>/database.ts` for its connection string, which brings that file into the service's
 *          own program, and no repository installs `encore.dev`. The declaration names only what that file uses, so
 *          the service typechecks without Encore.
 * Boundary: pure; types only, nothing runs from it. The Encore program (`stackra-encore`, its own tsconfig extending
 *           `encore`) never includes `.stackra/gen/*.d.ts`, so it keeps encore.dev's real types.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and ADR 0124 (Encore is generated into `stackra-encore` and stays out of the service
 *                     program); ADR 0238 (one database per service).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { usesDatabase } from "#core/functions/uses-database.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The declaration for `ir`, or undefined when its boot connects no database (or it is not a service).
 *
 * @example
 * emitEncoreSqldbTypes(serviceIr); // '...declare module "encore.dev/storage/sqldb" {...'
 */
export function emitEncoreSqldbTypes(ir: MemberIR): string | undefined {
  if (ir.layout !== "service" || !usesDatabase(ir)) return undefined;
  return [
    generatedHeader({
      from: "the generated database declaration (stackra-encore/<member>/database.ts)",
      purpose: `what ${ir.package}'s boot reads of Encore's SQL database, typed without installing encore.dev.`,
      boundary:
        "types only, for this member's own program; the Encore app under stackra-encore keeps encore.dev's real types.",
      runtime: "isomorphic",
    }),
    'declare module "encore.dev/storage/sqldb" {',
    "  /** A logical database Encore provisions; only what the generated database file and boot use. */",
    "  export class SQLDatabase {",
    "    constructor(name: string, config?: { readonly migrations?: string });",
    "    /** The connection string of this database in the running environment. */",
    "    readonly connectionString: string;",
    "  }",
    "}",
    "",
  ].join("\n");
}
