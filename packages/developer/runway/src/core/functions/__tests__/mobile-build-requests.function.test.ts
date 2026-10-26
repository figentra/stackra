/**
 * Stackra file contract:
 * Purpose: unit tests of `mobileBuildRequests`: a product merge asks for one platform-published build per mobile app;
 *          no apps asks for none; apps without a product are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decisions 2 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { PRODUCT_ROOT, STAFF_APP } from "#core/functions/__tests__/fixtures/product-root.fixture";
import { mobileBuildRequests } from "#core/functions/mobile-build-requests.function";
import { parseRunway } from "#core/functions/parse-runway.function";

const SHA = "c".repeat(40);
const BASE = { version: 3, project: "mezzora", environments: {} };

describe("mobileBuildRequests", () => {
  it("asks for one platform build per app on a product merge", () => {
    expect(mobileBuildRequests(PRODUCT_ROOT, SHA)).toEqual([
      {
        product: "mezzora",
        app: "staff",
        entry: STAFF_APP,
        trigger: "product-merge",
        sha: SHA,
        publisher: "platform",
      },
    ]);
  });

  it("asks for none without apps and refuses apps without a product", () => {
    expect(mobileBuildRequests(parseRunway("root", BASE), SHA)).toEqual([]);
    expect(() =>
      mobileBuildRequests(parseRunway("root", { ...BASE, mobile: { staff: STAFF_APP } }), SHA),
    ).toThrow(RunwayUnresolvedError);
  });
});
