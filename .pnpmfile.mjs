/**
 * Stackra file contract:
 * Purpose: the workspace pnpmfile; its one hook, `beforePacking`, drops a member's `#` subpath `imports` map from the
 *          package.json that `pnpm pack` and `pnpm publish` put in the tarball. In the repo the map points into `src`
 *          with fallback arrays (ADR 0006), which publint refuses; tsdown bundles every `#` import, so `dist` never
 *          names one and the published package does not need the map. A `dist` file that still imports a `#`
 *          specifier fails the pack instead of shipping a package that cannot resolve it. It also drops the repo-only
 *          `@stackra/source` export condition (it points into `src`, which a consumer never resolves) from `exports`.
 *          A Stackra package (a `stackra` field of kind `package`, any tier but `config`, with a code entry) packs
 *          only with its `stackra.manifest.json` on disk and in `files`: a host's gen reads it under `node_modules`
 *          (STA-1362). A data-only package (no `exports`, no `main`) has no module, so gen writes none.
 *          A package with a `files` list packs without its tests: the hook adds the `!` exclusions of
 *          `TEST_EXCLUDES` (`__tests__`, `__fixtures__`, `*.test.*`, …) to it. Then it reads every file the tarball
 *          would hold and refuses to pack one that is still a test file or holds a secret-shaped string (a private
 *          key block, a JWT, a payment, cloud or Git host key: `tools/scripts/pack-content.mjs`), naming the file,
 *          the line and the kind of string (STA-2917).
 * Boundary: rewrites the packed manifest only; the package.json on disk is unchanged. Installs are not hooked. It never
 *           generates the manifest: `stackra gen --manifests` writes it and it is committed (ADR 0294 decision 10).
 *           Imports node built-ins and `pack-content.mjs` only, since pnpm loads this file before any install.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks: publint, attw, packed-tarball smoke); ADR 0006 (`#` imports);
 *                     ADR 0453 (publishing to the Stackra registry packs through this hook); ADR 0294 (decisions 10
 *                     and 22: the committed manifest); ADR 0158 and STA-1308 (a package ships its manifest);
 *                     ADR 0022 and STA-2917 (tests stay in the repo).
 * Secrets: forbidden.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { packFindings, TEST_EXCLUDES } from "./tools/scripts/pack-content.mjs";

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

/** The manifest gen writes at a member root; a host's gen reads a dependency's under `node_modules`. */
const MANIFEST_FILE = "stackra.manifest.json";

/**
 * Refuses to pack a Stackra package without its manifest: one whose `stackra` field is of kind `package` (a missing
 * kind is a package) in any tier but `config` (the tooling presets have no `stackra.config.ts`, so gen writes none).
 * @throws when `stackra.manifest.json` is missing from `dir`, or `files` is set and leaves it out of the tarball.
 */
function requireManifest(pkg, dir) {
  const { stackra } = pkg;
  if (!stackra || (stackra.kind ?? "package") !== "package" || stackra.tier === "config") return;
  // A data-only package (no `exports`, no `main`, as flow-preset) has no module; gen writes none.
  if (pkg.exports === undefined && pkg.main === undefined) return;
  if (!existsSync(join(dir, MANIFEST_FILE)))
    throw new Error(
      `${pkg.name}: no ${MANIFEST_FILE} to pack; run \`stackra gen --manifests\` for this member and commit it`,
    );
  if (Array.isArray(pkg.files) && !pkg.files.includes(MANIFEST_FILE))
    throw new Error(`${pkg.name}: package.json \`files\` leaves out ${MANIFEST_FILE}; add it`);
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
 * `files` with the test exclusions added once each (`TEST_EXCLUDES`); `pkg` itself when it has no `files` list or
 * already names every exclusion.
 */
function withoutTests(pkg) {
  if (!Array.isArray(pkg.files)) return pkg;
  const missing = TEST_EXCLUDES.filter((entry) => !pkg.files.includes(entry));
  return missing.length === 0 ? pkg : { ...pkg, files: [...pkg.files, ...missing] };
}

/**
 * The manifest to pack for the member in `dir`: `pkg` without its `imports` map, without the `@stackra/source`
 * export condition and, with a `files` list, without its tests (`withoutTests`).
 * @throws when a built file in `dist` still imports a `#` specifier, which the published package could not resolve,
 *         when a Stackra package has no `stackra.manifest.json` to ship (`requireManifest`), or when a file the
 *         tarball would hold is a test file or holds a secret-shaped string (`packFindings`).
 */
function packedManifest(pkg, dir) {
  const published = withoutTests(withoutRepoFields(pkg, dir));
  const findings = packFindings(published, dir);
  if (findings.length > 0)
    throw new Error(
      `${pkg.name}: refusing to pack a test file or a secret-shaped string (STA-2917):\n  ${findings.join("\n  ")}`,
    );
  return published;
}

/**
 * `pkg` without its `imports` map and without the `@stackra/source` export condition; `pkg` itself when it has
 * neither.
 * @throws when a built file in `dist` still imports a `#` specifier, or a Stackra package has no manifest to ship.
 */
function withoutRepoFields(pkg, dir) {
  requireManifest(pkg, dir);
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
