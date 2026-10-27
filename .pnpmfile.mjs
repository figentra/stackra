/**
 * Stackra file contract:
 * Purpose: the workspace pnpmfile; its one hook, `beforePacking`, drops a member's `#` subpath `imports` map from the
 *          package.json that `pnpm pack` and `pnpm publish` put in the tarball. In the repo the map points into `src`
 *          with fallback arrays (ADR 0006), which publint refuses; tsdown bundles every `#` import, so `dist` never
 *          names one and the published package does not need the map. A `dist` file that still imports a `#`
 *          specifier fails the pack instead of shipping a package that cannot resolve it. It also drops the repo-only
 *          `@stackra/source` export condition (it points into `src`, which a consumer never resolves) from `exports`.
 * Boundary: rewrites the packed manifest only; the package.json on disk is unchanged. Installs are not hooked.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks: publint, attw, packed-tarball smoke); ADR 0006 (`#` imports);
 *                     ADR 0453 (publishing to the Stackra registry packs through this hook).
 * Secrets: forbidden.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The repo-only export condition that resolves a member to its `src` (workspace and tests only). */
const SOURCE_CONDITION = "@stackra/source";

/** `exports` with every `@stackra/source` condition removed, at any depth; strings and arrays keep their shape. */
function withoutSource(exports) {
  if (Array.isArray(exports)) return exports.map(withoutSource);
  if (exports === null || typeof exports !== "object") return exports;
  return Object.fromEntries(
    Object.entries(exports)
      .filter(([key]) => key !== SOURCE_CONDITION)
      .map(([key, value]) => [key, withoutSource(value)]),
  );
}

/** A line of built code that imports or re-exports a `#` specifier; comment lines are skipped before this runs. */
const HASH_IMPORT =
  /^\s*(?:(?:import|export)\b[^"'`]*|\}\s*)from\s*["']#|^\s*import\s*["']#|\bimport\(\s*["']#/;

/** Built files under `dist` (recursively) whose lines import a `#` specifier, as paths relative to `dir`. */
function hashImportsIn(dir) {
  let names;
  try {
    names = readdirSync(join(dir, "dist"), { recursive: true });
  } catch {
    return []; // no dist: nothing built, nothing that could name a `#` specifier
  }
  return names
    .filter((name) => /\.(?:mjs|js|d\.mts|d\.ts)$/.test(name))
    .filter((name) =>
      readFileSync(join(dir, "dist", name), "utf8")
        .split("\n")
        .some((line) => !/^\s*(?:\*|\/\/|\/\*)/.test(line) && HASH_IMPORT.test(line)),
    )
    .map((name) => join("dist", name));
}

/**
 * The manifest to pack for the member in `dir`: `pkg` without its `imports` map and without the `@stackra/source`
 * export condition.
 * @throws when a built file in `dist` still imports a `#` specifier, which the published package could not resolve.
 */
function packedManifest(pkg, dir) {
  const hasSource =
    pkg.exports !== undefined && JSON.stringify(pkg.exports).includes(`"${SOURCE_CONDITION}"`);
  if (!pkg.imports && !hasSource) return pkg;
  const published = { ...pkg };
  if (pkg.imports) {
    const left = hashImportsIn(dir);
    if (left.length > 0) {
      throw new Error(
        `${pkg.name}: ${left.join(", ")} still import a "#" specifier; bundle it in the build (tsdown) before packing`,
      );
    }
    delete published.imports;
  }
  if (hasSource) published.exports = withoutSource(pkg.exports);
  return published;
}

export const hooks = { beforePacking: packedManifest };
