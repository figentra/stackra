/**
 * Stackra file contract:
 * Purpose: unit tests of `EditionBundle`: the shipped schema is registered, a bundle parses, and a module listed twice
 *          or a key that is not snake_case fails.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (decisions 2, 5 and 6).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { EDITION_BUNDLE_SCHEMA } from "#core/constants/edition-bundle-schema.constant";
import { EditionBundle } from "#core/schemas/edition-bundle.schema";

const bundle = {
  product: "fashion",
  edition: { of: "commerce", version: "^1.0.0" },
  modules: ["fashion_sizes"],
  bundles: ["catalog", "orders"],
};

describe("EditionBundle", () => {
  it("registers the shipped schema and parses a bundle", () => {
    expect(schemaOf(EditionBundle)).toBe(EDITION_BUNDLE_SCHEMA);
    expect(validate(EditionBundle, bundle).success).toBe(true);
  });

  it("refuses a repeated or badly spelt module", () => {
    expect(validate(EditionBundle, { ...bundle, bundles: ["catalog", "catalog"] }).success).toBe(
      false,
    );
    expect(validate(EditionBundle, { ...bundle, modules: ["FashionSizes"] }).success).toBe(false);
  });
});
