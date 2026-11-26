/**
 * Stackra file contract:
 * Purpose: `encoreSetupImports`, the side-effect imports a generated `stackra-encore/<member>/*.ts` file puts first,
 *          ahead of the server app: the runtime environment (`import "./environment";`, so `createApp` knows where it
 *          runs before it builds the configuration; STA-1571), then the service's Encore database
 *          (`encoreDatabaseImport`, so `provideDatabaseUrl` has run before `#stackra/boot` connects; STA-1652).
 * Boundary: pure; each line only when its file is written (`emitEncoreEnvironment`, `emitEncoreDatabase`).
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and 0124 (Encore is generated, outside the service program); ADR 0238; ADR 0212
 *                     (decisions 1 and 4), STA-1571.
 */
import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The import lines that load the Encore environment and database of `ir` first.
 *
 * @param ir - the member read by discovery.
 * @example
 * encoreSetupImports(ir); // ['import "./environment";', 'import "./database";'] for a service with models
 */
export function encoreSetupImports(ir: MemberIR): string[] {
  return [
    ...(emitEncoreEnvironment(ir) === undefined ? [] : ['import "./environment";']),
    ...encoreDatabaseImport(ir),
  ];
}
