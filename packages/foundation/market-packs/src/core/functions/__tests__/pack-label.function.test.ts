/**
 * Stackra file contract:
 * Purpose: unit tests of `packLabel`: `market@version` for a base pack and `market/section@version` for a section.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing. Pack
 *           data is a made-up fixture, not any market's values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0370.
 */
import { describe, expect, it } from "@stackra/testing";

import { packLabel } from "#core/functions/pack-label.function";

describe("packLabel", () => {
  it("names a base pack and a section", () => {
    expect(packLabel({ market: "xa-one", version: "2.1.0" })).toBe("xa-one@2.1.0");
    expect(packLabel({ market: "xa", section: "shop", version: "2.0.0" })).toBe("xa/shop@2.0.0");
  });
});
