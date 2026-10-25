/**
 * Stackra file contract:
 * Purpose: unit and type tests of `slots`: a list takes each place from its name, a map gives each place, groups nest into
 *          dotted keys, and a bad name or place is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 18).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Place } from "#core/enums/place.enum";
import { slots } from "#core/functions/slots.function";
import type { SlotRef } from "#core/types/slot-ref.type";

describe("slots", () => {
  it("derives keys and places", () => {
    const Slots = slots({
      Dashboard: ["Header", "Main"],
      Shell: { Banner: Place.Banner, Checklist: Place.Checklist },
      Orders: {
        SalesOverview: ["Header", "Main"],
        Order: { View: { Aside: Place.Aside, Tabs: Place.Tabs } },
      },
      SalesToday: ["Column1"],
    });
    expect(Slots.Dashboard.Header).toEqual({ key: "dashboard.header", place: "band" });
    expect(Slots.Dashboard.Main).toEqual({ key: "dashboard.main", place: "grid" });
    expect(Slots.Shell.Banner).toEqual({ key: "shell.banner", place: "banner" });
    expect(Slots.Orders.SalesOverview.Main.key).toBe("orders.sales_overview.main");
    expect(Slots.Orders.Order.View.Aside).toEqual({
      key: "orders.order.view.aside",
      place: "aside",
    });
    expect(Slots.SalesToday.Column1.place).toBe("grid");
    expect(Object.isFrozen(Slots.Orders)).toBe(true);
    expectTypeOf(Slots.Orders.Order.View.Tabs).toEqualTypeOf<SlotRef>();
  });

  it("refuses a name that is not PascalCase and a mapped value that is not a place", () => {
    expect(() => slots({ dashboard: ["Main"] })).toThrow(RangeError);
    expect(() => slots({ Dashboard: ["main"] })).toThrow(RangeError);
    expect(() => slots({ Dashboard: { Main: "wide" as Place } })).toThrow(RangeError);
  });
});
