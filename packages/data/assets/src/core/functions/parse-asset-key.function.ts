/**
 * Stackra file contract:
 * Purpose: `parseAssetKey(key)`, which splits `<module>::<kind>/<path>` into its three parts and refuses any other
 *          string, for `assets()` (the tree check) and `AssetLibrary` (the published path).
 * Boundary: pure; internal to this package. The module and the kind are kebab-case names (ADR 0231); the path passes
 *           `isRelativePath`. Kind folders are not limited to a list here: gen owns that check (ADR 0234
 *           enforcement), and the template already ships `ai/` and `integrations/` beside the ADR's five.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 4: `::` keys); ADR 0231 (decision 3).
 */
import { isRelativePath } from "#core/functions/is-relative-path.function";

/**
 * The module, kind folder and path of an asset key.
 *
 * @throws TypeError when `key` is not `<module>::<kind>/<path>`.
 * @example
 * parseAssetKey("orders::ai/explain-order.md"); // { module: "orders", kind: "ai", path: "explain-order.md" }
 */
export function parseAssetKey(key: string): { module: string; kind: string; path: string } {
  const separator = key.indexOf("::");
  const rest = key.slice(separator + 2);
  const slash = rest.indexOf("/");
  const module = key.slice(0, separator);
  const kind = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  const name = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
  if (separator < 0 || slash < 0 || !name.test(module) || !name.test(kind) || !isRelativePath(path))
    throw new TypeError(
      `"${key}" is not an asset key: write <module>::<kind>/<path>, as in "orders::public/logo.svg"`,
    );
  return { module, kind, path };
}
