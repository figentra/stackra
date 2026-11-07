/**
 * Stackra file contract:
 * Purpose: unit tests of `exportSourceOf`: the `@stackra/source` condition wins over `default`, nested conditions
 *          are followed, a plain string target is taken as is, and the file resolves against the package folder; an
 *          absent export or one with neither condition is `undefined`.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 2); ADR 0025.
 */
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { exportSourceOf } from "#node/functions/export-source-of.function";
import type { WorkspacePackage } from "#node/types/workspace-package.type";

const DIR = join("/repo", "packages", "application", "example");

const PKG: WorkspacePackage = {
  dir: DIR,
  version: "1.0.0",
  exports: {
    "./console": { "@stackra/source": "./src/console.tsx", default: "./dist/console.mjs" },
    "./till": { import: { default: "./dist/till.mjs" }, default: { default: "./dist/till.cjs" } },
    "./landing": "./src/landing.tsx",
    "./types": { types: "./dist/index.d.ts" },
  },
};

describe("exportSourceOf", () => {
  it("prefers the @stackra/source condition", () => {
    expect(exportSourceOf(PKG, "./console")).toBe(join(DIR, "src", "console.tsx"));
  });

  it("follows nested default conditions, and takes a plain string target", () => {
    expect(exportSourceOf(PKG, "./till")).toBe(join(DIR, "dist", "till.cjs"));
    expect(exportSourceOf(PKG, "./landing")).toBe(join(DIR, "src", "landing.tsx"));
  });

  it("returns undefined for an absent export or one with neither condition", () => {
    expect(exportSourceOf(PKG, "./missing")).toBeUndefined();
    expect(exportSourceOf(PKG, "./types")).toBeUndefined();
  });
});
