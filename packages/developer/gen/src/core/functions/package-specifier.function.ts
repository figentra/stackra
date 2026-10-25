/**
 * Stackra file contract:
 * Purpose: `packageSpecifier`, the module specifier a host imports a dependency's class from: the dependency's package
 *          name, plus the subpath of the entry that exports the class's file (`@acme/loyalty-kit/node`).
 * Boundary: pure. The file comes from the dependency's committed manifest; a file outside the entry folders falls back
 *           to the `node` entry, where a package's module groups live.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders); ADR 0260 (a dependency is read from its manifest).
 */
import { entryOf } from "#core/functions/entry-of.function";

/**
 * The specifier of `file` in `pkg`.
 *
 * @example
 * packageSpecifier("@stackra/segments", "src/node/actions/recompute-segments.action.ts"); // "@stackra/segments/node"
 * packageSpecifier("@stackra/outbox", "src/core/drivers/memory-outbox.driver.ts"); // "@stackra/outbox"
 */
export function packageSpecifier(pkg: string, file: unknown): string {
  const entry = typeof file === "string" ? (entryOf(file) ?? "node") : "node";
  return entry === "index" ? pkg : `${pkg}/${entry}`;
}
