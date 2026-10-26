/**
 * Stackra file contract:
 * Purpose: unit tests of `findKits`: a registry's kits are found relative to it and a missing entry is skipped with a
 *          note; the variable and the command line add kits, a later one replacing an earlier one with the same id;
 *          a command-line folder without a kit throws.
 * Boundary: test only; kit folders in the system temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 4).
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { InvalidKitError } from "#core/errors/invalid-kit.error";
import { findKits } from "#node/functions/find-kits.function";
import { makeKitFolder } from "#node/functions/__tests__/fixtures/kit-folder.fixture";

describe("findKits", () => {
  it("reads a registry and skips what is not checked out", () => {
    const { root } = makeKitFolder("acme");
    const registry = join(root, "kits.json");
    writeFileSync(registry, JSON.stringify({ kits: ["assets/brand", "../nowhere"] }));
    const { kits, skipped } = findKits({ registry, folders: [] });
    expect(kits.map((located) => located.kit.id)).toEqual(["acme"]);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toContain("not checked out");
  });

  it("lets a later source replace a kit with the same id", () => {
    const first = makeKitFolder("acme");
    const second = makeKitFolder("acme");
    const { kits } = findKits({ variable: first.kit, folders: [second.kit] });
    expect(kits.map((located) => located.dir)).toEqual([second.kit]);
  });

  it("refuses a command-line folder without a kit", () => {
    const { root } = makeKitFolder("acme");
    expect(() => findKits({ folders: [root] })).toThrow(InvalidKitError);
  });
});
