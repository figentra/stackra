/**
 * Stackra file contract:
 * Purpose: `encoreDatabaseImport`, the side-effect import of the service's Encore database
 *          (`import "./database";`) that a generated `stackra-encore/<member>/*.ts` file puts first, ahead of the
 *          server app, so `provideDatabaseUrl` has run before `#stackra/boot` connects (STA-1652).
 * Boundary: pure; empty when the service has no database (`usesDatabase`), since `emitEncoreDatabase` then writes no
 *           `database.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0238 (the service's own database); ADR 0091 and 0124 (Encore is generated, outside the
 *                     service program).
 */
import { usesDatabase } from "#core/functions/uses-database.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The import lines that load the Encore database of `ir` first.
 *
 * @param ir - the member read by discovery.
 * @example
 * encoreDatabaseImport(ir); // ['import "./database";'] for a service with models, [] otherwise
 */
export function encoreDatabaseImport(ir: MemberIR): string[] {
  return usesDatabase(ir) ? ['import "./database";'] : [];
}
