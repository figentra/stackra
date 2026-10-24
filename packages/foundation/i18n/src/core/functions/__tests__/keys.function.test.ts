/**
 * Stackra file contract:
 * Purpose: unit and type tests of `keys(tree)`: leaves become `<namespace>::<path>` keys, `_` lifts its leaves onto
 *          the branch, enum labels index by code, the result is frozen and typed (unknown paths are type errors), and a
 *          name declared twice in one branch is refused.
 * Boundary: test only; the trees mirror the template's generated `#stackra/i18n` samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0268 (R15: typed keys); ADR 0294 (decision 20).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { keys } from "#core/functions/keys.function";
import type { I18nKey } from "#core/types/i18n-key.type";

const I18n = keys({
  web: {
    nav: ["home", "pricing"],
    features: { _: ["title"], catalogue: ["title", "body"] },
    enums: { billing_interval: ["month", "year"] },
  },
  leads: { refusals: ["rate_limited"] },
});

describe("keys", () => {
  it("builds <namespace>::<path> keys for every leaf", () => {
    expect(I18n.web.nav.home).toBe("web::nav.home");
    expect(I18n.web.features.catalogue.body).toBe("web::features.catalogue.body");
    expect(I18n.leads.refusals.rate_limited).toBe("leads::refusals.rate_limited");
  });

  it("lifts the leaves of `_` onto their branch", () => {
    expect(I18n.web.features.title).toBe("web::features.title");
    expect("_" in I18n.web.features).toBe(false);
  });

  it("lets an enum's labels index by its codes", () => {
    const interval: "month" | "year" = "year";
    expect(I18n.web.enums.billing_interval[interval]).toBe("web::enums.billing_interval.year");
  });

  it("accepts a namespace given as a plain leaf list", () => {
    expect(keys({ pages: ["title"] }).pages.title).toBe("pages::title");
  });

  it("freezes every level", () => {
    expect(Object.isFrozen(I18n)).toBe(true);
    expect(Object.isFrozen(I18n.web.features)).toBe(true);
  });

  it("types every leaf as an I18nKey and refuses unknown paths", () => {
    expectTypeOf(I18n.web.nav.home).toEqualTypeOf<I18nKey>();
    expectTypeOf(I18n.web.features.title).toEqualTypeOf<I18nKey>();
    // @ts-expect-error -- `shop` is not a leaf of `nav`
    expect(I18n.web.nav.shop).toBeUndefined();
  });

  it("refuses a `_` leaf that collides with a child branch", () => {
    expect(() => keys({ web: { features: { _: ["catalogue"], catalogue: ["title"] } } })).toThrow(
      /web::features\.catalogue" is declared twice/,
    );
  });
});
