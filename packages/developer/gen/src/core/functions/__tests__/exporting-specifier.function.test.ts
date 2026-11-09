/**
 * Stackra file contract:
 * Purpose: unit tests of `exportingSpecifier`: the convention's entry when its barrel exports the class, the entry
 *          whose barrel does otherwise (`@stackra/app`'s configs from `./server`), and another package's specifier kept.
 * Boundary: test only; the file exports are literals.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { exportingSpecifier } from "#core/functions/exporting-specifier.function";
import type { FileExports } from "#core/types/file-exports.type";

/** A barrel at `file` exporting `names`. */
const barrel = (file: string, names: readonly string[]): FileExports => ({
  file,
  importPath: `#${file.split("/")[1]}/index`,
  folder: file.split("/")[1] ?? "",
  names: names.map((name) => ({ name, typeOnly: false })),
});

/** `@stackra/app`'s barrels: its configs live in src/config and only `./server` exports them. */
const APP = [
  barrel("src/core/index.ts", ["createApp"]),
  barrel("src/server/index.ts", ["BearerConfig", "CorsConfig", "OidcJsonWebKeysDriver"]),
  barrel("src/contracts/index.ts", ["JsonWebKeys"]),
];

describe("exportingSpecifier", () => {
  it("moves a class to the entry whose barrel exports it", () => {
    expect(exportingSpecifier("@stackra/app", APP, "BearerConfig", "@stackra/app")).toBe(
      "@stackra/app/server",
    );
  });

  it("keeps the convention's entry when its barrel exports the class", () => {
    expect(exportingSpecifier("@stackra/app", APP, "JsonWebKeys", "@stackra/app/contracts")).toBe(
      "@stackra/app/contracts",
    );
    expect(exportingSpecifier("@stackra/app", APP, "createApp", "@stackra/app")).toBe(
      "@stackra/app",
    );
  });

  it("keeps another package's specifier and a name no barrel exports", () => {
    expect(exportingSpecifier("@stackra/app", APP, "Config", "@stackra/config")).toBe(
      "@stackra/config",
    );
    expect(exportingSpecifier("@stackra/app", APP, "Hidden", "@stackra/app")).toBe("@stackra/app");
  });
});
