/**
 * Stackra file contract:
 * Purpose: unit tests of `bundledRoot`: the package's `assets/` folder from this module and from a module in a
 *          nested folder, and the error when no `package.json` sits above the start.
 * Boundary: test only; writes into a fresh temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 2 and 6).
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "@stackra/testing";

import { bundledRoot } from "#node/functions/bundled-root.function";

describe("bundledRoot", () => {
  it("finds this package's assets folder", () => {
    expect(bundledRoot()).toBe(fileURLToPath(new URL("../../../../assets", import.meta.url)));
  });

  it("walks up from a nested module to the nearest package.json", () => {
    const root = mkdtempSync(join(tmpdir(), "stackra-skills-"));
    writeFileSync(join(root, "package.json"), "{}");
    mkdirSync(join(root, "dist", "chunks"), { recursive: true });

    expect(bundledRoot(pathToFileURL(join(root, "dist", "chunks", "node.mjs")).href)).toBe(
      join(root, "assets"),
    );
  });

  it("throws when no package.json sits above", () => {
    expect(() => bundledRoot("file:///stackra-skills-nowhere/node.mjs")).toThrow(
      /No package\.json above/,
    );
  });
});
