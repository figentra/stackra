/**
 * Stackra file contract:
 * Purpose: `packageSpecifier`, the module specifier a host imports a dependency's class from: the dependency's package
 *          name, plus the subpath of the entry that exports the class's file (`@acme/loyalty-kit/node`).
 * Boundary: pure. The file comes from the dependency's committed manifest. A file in another `src/<folder>` is
 *           exported by the entry of that name (`./desktop`, `./server`, `./worker`, `./browser`), as every package with
 *           such a folder declares it in package.json `exports`; a file under `src/modules` (a module group) or one the
 *           manifest does not record falls back to the `node` entry. A file gen writes into the dependency's own
 *           `.stackra/gen/<name>.ts` (its derived search queries) is never published: the host derives it again into
 *           its own `#stackra/<name>`, so that is where the class is imported from.
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
 * packageSpecifier("@stackra/storage", "src/desktop/drivers/x.driver.ts"); // "@stackra/storage/desktop"
 * packageSpecifier("@stackra/loyalty-kit", ".stackra/gen/search.ts"); // "#stackra/search"
 */
export function packageSpecifier(pkg: string, file: unknown): string {
  const generated =
    typeof file === "string" ? /^\.stackra\/gen\/([a-z-]+)\.ts$/.exec(file)?.[1] : undefined;
  if (generated !== undefined) return `#stackra/${generated}`;
  const entry =
    typeof file === "string"
      ? (entryOf(file) ?? /^src\/(?!modules\/)([a-z][a-z0-9-]*)\//.exec(file)?.[1] ?? "node")
      : "node";
  return entry === "index" ? pkg : `${pkg}/${entry}`;
}
