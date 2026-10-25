/**
 * Stackra file contract:
 * Purpose: proves `tabBarIcon` hands the native tab bar the SF Symbol of each tab name the template uses, and a plain
 *          circle for a name with no symbol, so a tab is never blank.
 * Boundary: test only; data, no React Native.
 * Runtime: node
 * Governing contract: ADR 0309; ADR 0022 (test placement).
 */
import { tabBarIcon } from "#native/tab-bar-icon/tab-bar-icon";

describe("tabBarIcon", () => {
  it.each([
    ["house", "house"],
    ["package", "shippingbox"],
    ["settings", "gearshape"],
  ] as const)("draws %s as the SF Symbol %s", (name, symbol) => {
    expect(tabBarIcon(name)).toEqual({ sfSymbol: symbol });
  });

  it("draws a circle for a name with no symbol", () => {
    expect(tabBarIcon("anchor")).toEqual({ sfSymbol: "circle" });
  });
});
