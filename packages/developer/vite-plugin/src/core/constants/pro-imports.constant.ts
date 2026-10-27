/**
 * Stackra file contract:
 * Purpose: `PRO_IMPORTS`, the HeroUI Pro specifiers written as import map keys (`@heroui-pro/*` and `@stackra/ui-pro`
 *          with its paths), so one matcher (`importMapResolves`) finds them in a module id or an import.
 * Boundary: data only. Pro code is never inside a product bundle; these keys only widen the externals under
 *           `proTypesOnly` and name what the bundle check refuses.
 * Runtime: node
 * Governing contract: owner decision D12 (Pro held once at the shell); ADR 0310; ADR 0436 (decision 9);
 *                     app-shells-edge-and-extension.md 16 (point 8).
 */
import type { ImportMap } from "#core/types/import-map.type";

/** The HeroUI Pro specifiers, as import map keys. */
export const PRO_IMPORTS: ImportMap = {
  imports: { "@heroui-pro/": "", "@stackra/ui-pro": "", "@stackra/ui-pro/": "" },
};
