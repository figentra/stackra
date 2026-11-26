/**
 * Stackra file contract:
 * Purpose: unit tests of `cliPackageRoot`: from this module it finds the folder of @stackra/cli's package.json, from a
 *          folder nested under it the same, and from a folder with no @stackra/cli above it it throws.
 * Boundary: test only; reads this package's package.json and writes a throwaway folder in the OS temp directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0177 (decision 5).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { cliPackageRoot } from "#node/functions/cli-package-root.function";

const PACKAGE = fileURLToPath(new URL("../../../../", import.meta.url)).replace(/\/$/, "");

describe("cliPackageRoot", () => {
  it("is the @stackra/cli package folder", () => {
    expect(cliPackageRoot()).toBe(PACKAGE);
    expect(cliPackageRoot(join(PACKAGE, "src/node/scaffold"))).toBe(PACKAGE);
  });

  it("skips another package's package.json and throws with none above", () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-cli-root-"));
    try {
      mkdirSync(join(root, "other/dist"), { recursive: true });
      writeFileSync(join(root, "other/package.json"), '{ "name": "@acme/other" }\n');
      expect(() => cliPackageRoot(join(root, "other/dist"))).toThrow(
        "no @stackra/cli package.json above the binary",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
