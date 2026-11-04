/**
 * Stackra file contract:
 * Purpose: unit tests of `readBundles`: each named surface's one version folder and its parsed manifest, in the order
 *          given; a missing bundle, two versions, an unreadable manifest, a manifest that breaks its schema and one
 *          whose version is not its folder's are all reported at once in one `RunwayInvalidError`.
 * Boundary: test only; writes built bundles in the OS temp directory with the publish fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 4); app-shells 4.2.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { readBundles } from "#node/functions/read-bundles.function";
import { writeBundle } from "#node/functions/__tests__/fixtures/product-root.fixture";

let repository: string;

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-runway-bundles-"));
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("readBundles", () => {
  it("reads each surface's bundle in the order given", () => {
    writeBundle(repository, "console", "1.2.0");
    writeBundle(repository, "till", "0.3.0");

    const bundles = readBundles(repository, ["till", "console"]);

    expect(bundles.map((bundle) => [bundle.surface, bundle.manifest.version])).toEqual([
      ["till", "0.3.0"],
      ["console", "1.2.0"],
    ]);
    expect(bundles[1]?.folder).toBe(join(repository, "dist/bundles/console/1.2.0"));
    expect(bundles[1]?.manifest.modulepreload).toEqual(["entry-abc.js", "chunks/view-def.js"]);
  });

  it("reports every missing or invalid bundle at once", () => {
    writeBundle(repository, "two", "1.0.0");
    writeBundle(repository, "two", "1.1.0");
    mkdirSync(join(repository, "dist/bundles/broken/1.0.0"), { recursive: true });
    writeFileSync(join(repository, "dist/bundles/broken/1.0.0/bundle.manifest.json"), "{");
    writeBundle(repository, "escape", "1.0.0", { entry: "../outside.js" });
    writeBundle(repository, "moved", "2.0.0", { version: "1.9.0" });

    let caught: unknown;
    try {
      readBundles(repository, ["missing", "two", "broken", "escape", "moved"]);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(RunwayInvalidError);
    const issues = (caught as RunwayInvalidError).issues;
    expect(issues.map((issue) => issue.path)).toEqual([
      "dist/bundles/missing",
      "dist/bundles/two",
      "dist/bundles/broken/1.0.0/bundle.manifest.json",
      "dist/bundles/escape/1.0.0/bundle.manifest.json:entry",
      "dist/bundles/moved/2.0.0/bundle.manifest.json:version",
    ]);
    expect(issues[0]?.message).toMatch(/^No built bundle/);
    expect(issues[1]?.message).toMatch(/\(1\.0\.0, 1\.1\.0\)/);
    expect(issues[2]?.message).toMatch(/^Not readable as JSON/);
    expect(issues[4]?.message).toBe("The manifest says 1.9.0, the folder 2.0.0");
  });
});
