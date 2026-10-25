/**
 * Stackra file contract:
 * Purpose: `AssetKey`, the template-literal type of an asset key, `<module>::<kind>/<path>`
 *          (`orders::public/logo.svg`), so a string without the namespace or the kind folder does not typecheck.
 * Boundary: type only; `assets()` checks the full grammar at runtime (kebab-case module and kind, a relative path).
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 2 and 4: kind folders, `::` keys); ADR 0294 (decision 20).
 */

/**
 * An asset key: the module key, `::`, the kind folder, `/`, then the path inside that folder.
 *
 * @example
 * const key: AssetKey = "orders::ai/explain-order.md";
 */
export type AssetKey = `${string}::${string}/${string}`;
