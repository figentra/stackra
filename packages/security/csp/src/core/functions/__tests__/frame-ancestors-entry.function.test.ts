/**
 * Stackra file contract:
 * Purpose: unit tests of `frameAncestorsEntry`: an exact key before the longest `/*` prefix, a prefix below its slash
 *          only, and undefined for an unmatched path or a prototype name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0334 rule 12.
 */
import { describe, expect, it } from "@stackra/testing";

import { frameAncestorsEntry } from "#core/functions/frame-ancestors-entry.function";

const config = {
  frameAncestors: {
    "/preview": ["https://console.pay.example"],
    "/c/*": "request" as const,
    "/c/static/*": ["self"],
  },
};

describe("frameAncestorsEntry", () => {
  it("takes an exact key, then the longest prefix", () => {
    expect(frameAncestorsEntry(config, "/preview")).toEqual(["https://console.pay.example"]);
    expect(frameAncestorsEntry(config, "/c/cs_01")).toBe("request");
    expect(frameAncestorsEntry(config, "/c/static/a.js")).toEqual(["self"]);
  });

  it("is undefined for an unmatched path or a prototype name", () => {
    for (const path of ["/", "/c", "/preview/", "constructor", "__proto__"])
      expect(frameAncestorsEntry(config, path)).toBeUndefined();
  });
});
