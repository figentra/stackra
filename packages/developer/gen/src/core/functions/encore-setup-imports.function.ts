/**
 * Stackra file contract:
 * Purpose: `encoreSetupImports`, the side-effect imports a generated `stackra-encore/<member>/*.ts` file puts first,
 *          ahead of the server app: the running environment (`import "./environment";`, so `STACKRA_ENVIRONMENT` is
 *          settled before any configuration is built; STA-2844), then the service's Encore database
 *          (`encoreDatabaseImport`, so `provideDatabaseUrl` has run before `#stackra/boot` connects; STA-1652).
 * Boundary: pure; each line only when its file is written (`emitEncoreEnvironment`, `emitEncoreDatabase`).
 * Runtime: isomorphic
 * Governing contract: ADR 0091 and 0124 (Encore is generated, outside the service program); ADR 0238; ADR 0296
 *                     (amendment 2026-11-26); STA-2844.
 */
import { emitEncoreEnvironment } from "#core/functions/emit-encore-environment.function";
import { encoreDatabaseImport } from "#core/functions/encore-database-import.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The import lines that load the Encore environment and database of `ir` first.
 *
 * @param ir - the member read by discovery.
 * @example
 * encoreSetupImports(ir); // ['import "./environment";', 'import "./database";'] for an app service with models
 */
export function encoreSetupImports(ir: MemberIR): string[] {
  return [
    ...(emitEncoreEnvironment(ir) === undefined ? [] : ['import "./environment";']),
    ...encoreDatabaseImport(ir),
  ];
}
