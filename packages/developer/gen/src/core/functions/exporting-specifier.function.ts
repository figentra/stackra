/**
 * Stackra file contract:
 * Purpose: `exportingSpecifier`, the entry that really exports a package's class: the folder convention's entry
 *          (`packageSpecifier`) when its barrel exports the name, else the entry whose barrel does. `@stackra/app`
 *          keeps its configs in `src/config` but exports them from `./server`, so the convention's root entry was wrong
 *          there and a host's wiring failed typecheck.
 * Boundary: pure; reads the package's own barrels (`src/<entry>/index.ts`, the root's being `src/core/index.ts`) from
 *           the member's file exports. A specifier of another package, or a package whose barrels are not read, is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15: entry folders); ADR 0263 (a host's wiring lists its packages' drivers).
 */
import type { FileExports } from "#core/types/file-exports.type";

/** The barrel of an entry specifier of `pkg`. */
function barrelOf(pkg: string, specifier: string): string {
  return specifier === pkg
    ? "src/core/index.ts"
    : `src/${specifier.slice(pkg.length + 1)}/index.ts`;
}

/**
 * The specifier of the entry of `pkg` that exports `name`, starting from `specifier`.
 *
 * @example
 * exportingSpecifier("@stackra/app", files, "BearerConfig", "@stackra/app"); // "@stackra/app/server"
 */
export function exportingSpecifier(
  pkg: string,
  files: readonly FileExports[],
  name: string,
  specifier: string,
): string {
  if (specifier !== pkg && !specifier.startsWith(`${pkg}/`)) return specifier;
  const exports = (file: FileExports): boolean => file.names.some((entry) => entry.name === name);
  const barrels = files.filter((file) => /^src\/[a-z][a-z0-9-]*\/index\.ts$/.test(file.file));
  const own = barrels.find((file) => file.file === barrelOf(pkg, specifier));
  if (own === undefined || exports(own)) return specifier;
  const other = barrels.find(exports);
  if (other === undefined) return specifier;
  const entry = other.file.split("/")[1];
  return entry === "core" ? pkg : `${pkg}/${entry}`;
}
