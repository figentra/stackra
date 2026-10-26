/**
 * Stackra file contract:
 * Purpose: `categoryOf(dir)`, the category of a package directory (`packages/<category>/<name>` or
 *          `packages/tooling/<name>`).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0127; ADR 0003.
 */
import { CATEGORY_NAMES } from "#node/constants/category-names.constant";
import { TOOLING } from "#node/constants/tooling.constant";

/**
 * The category of the package at `dir`, or null when `dir` is not a package directory.
 *
 * @param dir - repository-relative, forward slashes.
 * @example
 * categoryOf("packages/tooling/oxlint"); // "tooling"
 */
export function categoryOf(dir: string): string | null {
  const [top, category, name] = dir.split("/");
  if (top !== "packages" || !name || category === undefined) return null;
  if (category === TOOLING.name) return TOOLING.name;
  return CATEGORY_NAMES.includes(category) ? category : null;
}
