/**
 * Stackra file contract:
 * Purpose: `entitiesFile(ir, module)`, where a module's entity file lives and how code imports it. A package's is the
 *          committed generated contract `src/node/entities.gen.ts` (`#node/entities.gen`), so its built `./node` inlines
 *          the list and no build waits for gen; a service's or an app's stays in the gitignored
 *          `.stackra/gen/entities/<module>.ts` (`#stackra/entities/<module>`) (STA-1874, ADR 0294 R10 as amended).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R10, amended 2026-11-01); ADR 0295 (amended 2026-11-01); STA-1874.
 */
import { PACKAGE_ENTITIES_FILE } from "#core/constants/package-entities-file.constant";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The path gen writes `module`'s entity file to, and the specifier code imports it by.
 *
 * @param ir - the member read by discovery.
 * @param module - the module key whose models the file holds.
 * @example
 * entitiesFile(packageIr, "access_log"); // { path: "src/node/entities.gen.ts", specifier: "#node/entities.gen" }
 * entitiesFile(serviceIr, "shop"); // { path: ".stackra/gen/entities/shop.ts", specifier: "#stackra/entities/shop" }
 */
export function entitiesFile(
  ir: MemberIR,
  module: string,
): { readonly path: string; readonly specifier: string } {
  return ir.layout === "package"
    ? { path: PACKAGE_ENTITIES_FILE, specifier: "#node/entities.gen" }
    : { path: `.stackra/gen/entities/${module}.ts`, specifier: `#stackra/entities/${module}` };
}
