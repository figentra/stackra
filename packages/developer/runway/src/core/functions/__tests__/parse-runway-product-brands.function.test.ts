/**
 * Stackra file contract:
 * Purpose: unit tests of `parseRunway` for the edition sections: the root `product` (a base product, an edition with
 *          its base and range), whose misspelt key, missing field or unknown field fails, and an app member's `brands`,
 *          which is refused (STA-2028).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decisions 2 and 8); ADR 0296.
 */
import { describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { parseRunway } from "#core/functions/parse-runway.function";

const ROOT = { version: 3, project: "fashion", environments: {} };
const APP = { version: 3, environments: {} };
const BRAND = { key: "atelier", name: "Atelier", tokens: "t.css", appId: "com.atelier.shop" };

/** The paths of the issues `run` throws. */
function issuePaths(run: () => unknown): string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof RunwayInvalidError) return error.issues.map((issue) => issue.path);
    throw error;
  }
  throw new Error("expected a RunwayInvalidError");
}

/** A parse of the root runway with `product`, deferred for `issuePaths`. */
const parseRootWithProduct = (product: unknown) => () => parseRunway("root", { ...ROOT, product });

describe("parseRunway product", () => {
  it("accepts a base product and an edition", () => {
    expect(parseRunway("root", { ...ROOT, product: { key: "commerce" } }).product).toEqual({
      key: "commerce",
    });
    const edition = { key: "fashion", edition: { of: "commerce", version: "^1.0.0" } };
    expect(parseRunway("root", { ...ROOT, product: edition }).product).toEqual(edition);
  });

  it("refuses a bad key, a missing base version and an unknown field", () => {
    expect(issuePaths(parseRootWithProduct({ key: "Fashion" }))).toEqual(["product.key"]);
    expect(
      issuePaths(parseRootWithProduct({ key: "fashion", edition: { of: "commerce" } })),
    ).toEqual(["product.edition.version"]);
    expect(issuePaths(parseRootWithProduct({ key: "fashion", base: "commerce" }))).toEqual([
      "product",
    ]);
  });
});

describe("parseRunway brands", () => {
  it("refuses an app runway's brands: brands live in stackra.config.ts (ADR 0335, STA-2028)", () => {
    expect(() => parseRunway("app", { ...APP, brands: [BRAND] })).toThrow(RunwayInvalidError);
  });
});
