/**
 * Stackra file contract:
 * Purpose: `encoreFirstImports`, the side-effect imports a generated `stackra-encore/<member>/*.ts` file puts first,
 *          ahead of everything that loads the server app: the running environment (`import "./environment";`,
 *          STA-2798), then the service's Encore database (`encoreDatabaseImport`, STA-1652).
 * Boundary: pure; each line only when its file is written: the environment for a service on the generated server
 *           entry (`emitEncoreEnvironment`), the database for one with a database.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and 0124 (Encore is generated, outside the service program); ADR 0238; STA-2798.
 */
import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The import lines that run before the server app loads.
 *
 * @param ir - the member read by discovery.
 * @example
 * encoreFirstImports(ir); // ['import "./environment";', 'import "./database";'] for a service with models
 */
export function encoreFirstImports(ir: MemberIR): string[] {
  const environment = emitEncoreEnvironment(ir) === undefined ? [] : ['import "./environment";'];
  return [...environment, ...encoreDatabaseImport(ir)];
}
