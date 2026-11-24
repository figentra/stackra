/**
 * Stackra file contract:
 * Purpose: proves the vitest this preset installs and the coverage package it installs beside it are one version, and
 *          that this is the version vitest peers the coverage package at. A split pair (5.0.5 beside 5.0.3 in 0.33.0)
 *          makes a consumer resolve two copies of vitest, and `describe` from `@stackra/testing` then throws "Cannot read
 *          properties of undefined (reading 'config')".
 * Boundary: test only; reads the installed packages' manifests, runs no coverage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the versions rule (catalogs are the one source).
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

/** The manifest of an installed package, found from this package's own node_modules. */
const manifestOf = (name: string) => {
  const main = require.resolve(name);
  let dir = dirname(main);
  let manifest:
    | { name?: string; version: string; peerDependencies?: Record<string, string> }
    | undefined;
  while (manifest?.name !== name) {
    const file = join(dir, "package.json");
    manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : undefined;
    if (manifest?.name !== name) dir = dirname(dir);
  }
  return manifest;
};

describe("the vitest and coverage pair", () => {
  const vitest = manifestOf("vitest");
  const coverage = manifestOf("@vitest/coverage-v8");

  it("installs vitest and @vitest/coverage-v8 at one version", () => {
    expect(coverage.version).toBe(vitest.version);
  });

  it("is the version vitest peers the coverage package at", () => {
    expect(vitest.peerDependencies?.["@vitest/coverage-v8"]).toBe(coverage.version);
  });
});
