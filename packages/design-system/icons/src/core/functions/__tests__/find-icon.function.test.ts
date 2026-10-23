/**
 * Stackra file contract:
 * Purpose: proves `findIcon` returns the component registered under a name, falls back to the Lucide name of an
 *          alias, prefers a direct entry over the alias target, and never reads inherited properties.
 * Boundary: pure function over stand-in components.
 * Runtime: node
 * Governing contract: ADR 0303 (decision 10); ADR 0022 (test placement).
 */
// @covers sta-350:FR-049
import type { IconComponent } from "#contracts/types/icon-component.type";
import { findIcon } from "#core/functions/find-icon.function";

const cart: IconComponent = () => null;
const bag: IconComponent = () => null;
const badge: IconComponent = () => null;

describe("findIcon", () => {
  it("returns the component registered under the name", () => {
    expect(
      findIcon({ "shopping-cart": cart, "loyalty::points-badge": badge }, "shopping-cart"),
    ).toBe(cart);
    expect(findIcon({ "loyalty::points-badge": badge }, "loyalty::points-badge")).toBe(badge);
  });

  it("resolves an alias through the Lucide name it stands for", () => {
    expect(findIcon({ "shopping-cart": cart }, "orders")).toBe(cart);
  });

  it("prefers an entry under the alias itself", () => {
    expect(findIcon({ orders: bag, "shopping-cart": cart }, "orders")).toBe(bag);
  });

  it("returns undefined for a name nothing holds", () => {
    expect(findIcon({}, "arrow-right")).toBeUndefined();
    expect(findIcon({ "shopping-cart": cart }, "customers")).toBeUndefined();
    expect(findIcon({}, "orders")).toBeUndefined();
  });

  it("never reads inherited properties", () => {
    // `constructor` is not an IconName; data-driven strings can be anything, which is why the lookup is guarded.
    expect(findIcon({}, "constructor" as never)).toBeUndefined();
    expect(findIcon({}, "toString" as never)).toBeUndefined();
  });
});
