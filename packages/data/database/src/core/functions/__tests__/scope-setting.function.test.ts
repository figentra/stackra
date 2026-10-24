/**
 * Stackra file contract:
 * Purpose: unit tests of the internal `scopeSetting` and `modelKey`: a scope level's setting name, a refused level,
 *          and a model class name's key and input id key.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; ADR 0294 (decision 20); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { modelKey } from "#core/functions/model-key.function";
import { scopeSetting } from "#core/functions/scope-setting.function";

describe(scopeSetting, () => {
  it("names the setting of a level and refuses a level that is not snake_case", () => {
    expect(scopeSetting("workspace")).toBe("app.workspace_id");
    expect(() => scopeSetting("Work Space")).toThrow(TypeError);
  });

  it("derives a model key and its id key", () => {
    expect(modelKey("ProductCollection")).toEqual({
      key: "product_collection",
      idKey: "productCollectionId",
    });
  });
});
