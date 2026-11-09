/**
 * Stackra file contract:
 * Purpose: unit tests of `optionsOf`: the unit's options fill what the pack leaves out, the pack wins on a shared key,
 *          and no mandate or no unit options is the other side alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0364 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { optionsOf } from "#core/functions/options-of.function";

describe("optionsOf", () => {
  const pack = { options: { submitUrl: "https://api.invoicing.eta.gov.eg", taxTypes: ["T1"] } };

  it("fills what the pack leaves out with the unit's options", () => {
    expect(optionsOf(pack, { options: { activityCode: "4620" } })).toEqual({
      submitUrl: "https://api.invoicing.eta.gov.eg",
      taxTypes: ["T1"],
      activityCode: "4620",
    });
  });

  it("keeps the pack's value on a key both hold, so a unit never redirects a market fact", () => {
    const options = optionsOf(pack, {
      options: { submitUrl: "https://elsewhere.example", activityCode: "4620" },
    });
    expect(options["submitUrl"]).toBe("https://api.invoicing.eta.gov.eg");
  });

  it("is the other side alone when there is no mandate or no unit options", () => {
    expect(optionsOf(null, { options: { activityCode: "4620" } })).toEqual({
      activityCode: "4620",
    });
    expect(optionsOf(pack, {})).toEqual(pack.options);
  });
});
