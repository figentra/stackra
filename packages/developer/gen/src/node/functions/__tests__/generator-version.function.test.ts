/**
 * Stackra file contract:
 * Purpose: unit tests of `generatorVersion` (STA-1571): from this source tree it answers this package's own version;
 *          from a folder under an installed `node_modules/@stackra/gen` it answers that one; with no `@stackra/gen`
 *          package.json above, undefined.
 * Boundary: test only; writes package.json files under a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1571, STA-2844.
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { generatorVersion } from "#node/functions/generator-version.function";

describe("generatorVersion", () => {
  it("answers this package's own version from its source tree", () => {
    const own = JSON.parse(
      readFileSync(new URL("../../../../package.json", import.meta.url), "utf8"),
    ) as { readonly name: string; readonly version: string };
    expect(own.name).toBe("@stackra/gen");
    expect(generatorVersion()).toBe(own.version);
  });

  it("answers an installed gen's version, skipping other packages on the way up", () => {
    const root = mkdtempSync(join(tmpdir(), "gen-version-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "acme", version: "9.9.9" }));
    const installed = join(root, "node_modules/@stackra/gen");
    mkdirSync(join(installed, "dist"), { recursive: true });
    writeFileSync(
      join(installed, "package.json"),
      JSON.stringify({ name: "@stackra/gen", version: "0.34.2" }),
    );
    expect(generatorVersion(join(installed, "dist"))).toBe("0.34.2");
  });

  it("answers undefined with no @stackra/gen package.json above", () => {
    const root = mkdtempSync(join(tmpdir(), "gen-version-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "acme", version: "1.0.0" }));
    mkdirSync(join(root, "dist"));
    // The walk passes `root` and goes on to the filesystem root, where no @stackra/gen package.json is.
    expect(generatorVersion(join(root, "dist"))).toBeUndefined();
  });
});
