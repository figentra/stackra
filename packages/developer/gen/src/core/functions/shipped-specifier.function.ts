/**
 * Stackra file contract:
 * Purpose: `shippedSpecifier`, the module specifier a generated schema imports a package's shipped `X$` from, given
 *          the entry barrel that exports it: `src/core/index.ts` (or `dist/index.d.mts`, or a root `index.d.ts`) is
 *          the package, and `src/contracts/index.ts` (or `dist/contracts.d.mts`) is `<package>/contracts`.
 * Boundary: pure. Only the isomorphic entries (`.` and `./contracts`) count, because `#stackra/schemas` is isomorphic;
 *           any other file, a `./node` or `./testing` barrel included, is no shipped-schema source.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 26: a package ships its own `X$`); STA-1284; STA-1290.
 */

/**
 * The specifier of the entry barrel at `file` in `pkg`, when it is an isomorphic entry.
 *
 * @param pkg - the package name.
 * @param file - the barrel's path relative to the package root.
 * @example
 * shippedSpecifier("@stackra/validation", "src/core/index.ts"); // "@stackra/validation"
 * shippedSpecifier("@stackra/iam", "dist/contracts.d.mts"); // "@stackra/iam/contracts"
 * shippedSpecifier("@stackra/iam", "src/node/index.ts"); // undefined
 */
export function shippedSpecifier(pkg: string, file: string): string | undefined {
  const folder =
    /^src\/([a-z]+)\/index\.tsx?$/.exec(file)?.[1] ??
    /^(?:dist\/)?([a-z]+)\.d\.[cm]?ts$/.exec(file)?.[1];
  if (folder === "core" || folder === "index") return pkg;
  return folder === "contracts" ? `${pkg}/contracts` : undefined;
}
