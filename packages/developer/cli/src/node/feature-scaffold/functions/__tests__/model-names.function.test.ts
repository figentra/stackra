/**
 * Stackra file contract:
 * Purpose: unit tests of `modelNames`: the class, stem, key segment, camelCase singular and plural, the table gen
 *          derives and the module's schema, from a kebab-case or PascalCase model name.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { modelNames } from "#node/feature-scaffold/functions/model-names.function";

describe(modelNames, () => {
  it("derives every name gen derives", () => {
    const names = {
      module: "price-lists",
      schema: "price_lists",
      stem: "price-entry",
      className: "PriceEntry",
      snake: "price_entry",
      camel: "priceEntry",
      table: "price_entries",
      plural: "priceEntries",
    };

    expect(modelNames("price-lists", "price-entry")).toEqual(names);
    expect(modelNames("price-lists", "PriceEntry")).toEqual(names);
  });
});
