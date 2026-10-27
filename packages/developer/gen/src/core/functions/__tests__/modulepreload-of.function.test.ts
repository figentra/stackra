/**
 * Stackra file contract:
 * Purpose: unit tests of `modulepreloadOf`: the shell entry first, then the bundle's files joined onto its base, no
 *          duplicates, and a base without a trailing `/` refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436; app-shells-edge-and-extension.md 15 (point 8).
 */
import { describe, expect, it } from "@stackra/testing";

import { modulepreloadOf } from "#core/functions/modulepreload-of.function";

const BUNDLE = { modulepreload: ["console.a1b2.js", "chunks/orders.c3d4.js"] };

describe("modulepreloadOf", () => {
  it("lists the shell entry, then the bundle's entry and static chunks", () => {
    expect(
      modulepreloadOf("/shell/console/3.2.0/entry.js", "/b/mezzora/console/1.4.0/", BUNDLE),
    ).toEqual([
      "/shell/console/3.2.0/entry.js",
      "/b/mezzora/console/1.4.0/console.a1b2.js",
      "/b/mezzora/console/1.4.0/chunks/orders.c3d4.js",
    ]);
  });

  it("drops a duplicate", () => {
    expect(modulepreloadOf("/b/x.js", "/b/", { modulepreload: ["x.js"] })).toEqual(["/b/x.js"]);
  });

  it("refuses a base that is not a folder", () => {
    expect(() => modulepreloadOf("/shell.js", "/b/mezzora/console/1.4.0", BUNDLE)).toThrow(
      RangeError,
    );
  });
});
