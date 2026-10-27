/**
 * Stackra file contract:
 * Purpose: unit tests of `checkEditionBundle`: a bundle over known base modules passes; an empty base is
 *          `base_unknown`; an unknown bundled module and an edition module on a base key are refused, in key order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0335 (enforcement); ADR 0349.
 */
import { describe, expect, it } from "@stackra/testing";

import { checkEditionBundle } from "#core/functions/check-edition-bundle.function";

const bundle = {
  edition: { of: "commerce", version: "^1.0.0" },
  modules: ["fashion_sizes"],
  bundles: ["catalog", "orders"],
};
const base = [{ key: "catalog" }, { key: "orders" }, { key: "tills" }];

describe("checkEditionBundle", () => {
  it("passes a bundle of released base modules", () => {
    expect(checkEditionBundle(bundle, base)).toEqual([]);
  });

  it("refuses a base with no release in range", () => {
    expect(checkEditionBundle(bundle, []).map((issue) => issue.code)).toEqual(["base_unknown"]);
  });

  it("refuses unknown bundled modules and taken module keys", () => {
    expect(
      checkEditionBundle(
        { ...bundle, modules: ["tills"], bundles: ["catalog", "returns"] },
        base,
      ).map((issue) => [issue.code, issue.module]),
    ).toEqual([
      ["bundled_module_unknown", "returns"],
      ["module_key_taken", "tills"],
    ]);
  });
});
