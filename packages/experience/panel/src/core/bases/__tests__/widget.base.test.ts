/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Widget<Q>` and `Widget.place`: the kind record in layer 1, the checked options (size,
 *          order, ranges, refresh at least 30 seconds), a placement shadow in layer 2 or the given layer that keeps the
 *          base's display, and the refusals of a placement that changes more than it may.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 to 19); ADR 0306 (rules 6 to 8); ADR 0336 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { WidgetBase } from "#core/bases/widget-base.base";
import { Widget } from "#core/bases/widget.base";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { Place } from "#core/enums/place.enum";
import { TimeRange } from "#core/enums/time-range.enum";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { describeWidget } from "#core/functions/describe-widget.function";
import type { Display } from "#core/types/display.type";

/** Stands in for the icon constants gen emits in an app. */
const TestIcons = {
  Banknote: "banknote",
} as const;

/** A metric stand-in. */
interface Metric {
  readonly value: number | null;
  readonly previous: number | null;
  readonly target: number | null;
}

/** The query output stand-in. */
interface KpisOutput {
  readonly revenue: Metric;
  readonly orders: Metric;
  readonly items: readonly { readonly variantId: string; readonly available: number }[];
}

/** A query stand-in, typed by its `handle`. */
class KpisQuery {
  async handle(_input: { readonly range: TimeRange; readonly limit: number }): Promise<KpisOutput> {
    return {
      revenue: { value: 1, previous: 1, target: null },
      orders: { value: 1, previous: 1, target: null },
      items: [],
    };
  }
}

class Changed {}

const MAIN = { key: "dashboard.main", place: Place.Grid };
const HEADER = { key: "dashboard.header", place: Place.Band };

class KpisWidget extends Widget<KpisQuery>({
  slot: HEADER,
  order: 10,
  ranges: [TimeRange.Today, TimeRange.Last7Days],
  range: TimeRange.Today,
  params: { limit: 5 },
  refreshOn: [Changed],
  refreshEvery: "60s",
}) {
  display(d: Display<KpisOutput>) {
    return d.kpiGroup([d.kpi("revenue").icon("banknote"), d.kpi("orders").lowerIsBetter()]);
  }
}

describe("Widget", () => {
  it("records its checked options in the owner's layer", () => {
    const record = kindOf(KpisWidget);
    expect(record?.kind).toBe("widget");
    expect(record?.options).toMatchObject({ slot: HEADER, order: 10, layer: PlacementLayer.Owner });
    expect(Object.create(KpisWidget.prototype as object)).toBeInstanceOf(WidgetBase);
  });

  it("refuses a bad size, a fractional order, a range outside its ranges and a refresh under 30 seconds", () => {
    const widget = Widget as unknown as (options: object) => unknown;
    expect(() => widget({ size: "huge" })).toThrow(TypeError);
    expect(() => widget({ order: 1.5 })).toThrow(TypeError);
    expect(() => widget({ ranges: [TimeRange.Today], range: TimeRange.ThisMonth })).toThrow(
      TypeError,
    );
    expect(() => widget({ refreshEvery: "10s" })).toThrow(RangeError);
    expect(() => widget({ slot: "dashboard.main" })).toThrow(TypeError);
  });

  it("records the display the class builds", () => {
    expect(describeWidget(KpisWidget)).toMatchObject({
      layer: PlacementLayer.Owner,
      display: {
        kind: "kpi_group",
        kpis: [
          { kind: "kpi", path: "revenue", icon: TestIcons.Banknote },
          { kind: "kpi", path: "orders", lowerIsBetter: true },
        ],
      },
    });
  });

  it("places a widget it does not own in the host layer, keeping its display", () => {
    class Placed extends Widget.place(KpisWidget, {
      slot: MAIN,
      order: 40,
      size: WidgetSize.Large,
    }) {}
    const tree = describeWidget(Placed);
    expect(tree.layer).toBe(PlacementLayer.Host);
    expect(tree.placedFrom).toBe(KpisWidget);
    expect(tree.options).toMatchObject({
      slot: MAIN,
      order: 40,
      size: WidgetSize.Large,
      range: TimeRange.Today,
    });
    expect(tree.display.kind).toBe("kpi_group");
  });

  it("takes the edition layer 2b and the app layer for a placement", () => {
    class Edition extends Widget.place(KpisWidget, {
      slot: null,
      layer: PlacementLayer.Edition,
    }) {}
    expect(describeWidget(Edition).layer).toBe("2b");
    expect(() => Widget.place(KpisWidget, { layer: PlacementLayer.User as never })).toThrow(
      TypeError,
    );
  });

  it("refuses a placement of a class that is not a widget or one that changes the query", () => {
    expect(() => Widget.place(Changed as never, {})).toThrow(TypeError);
    expect(() => Widget.place(KpisWidget, { query: Changed } as never)).toThrow(/query/);
  });

  it("types params against the query input and requires the type argument", () => {
    expectTypeOf<Parameters<KpisWidget["display"]>[0]>().toEqualTypeOf<Display<KpisOutput>>();
    // @ts-expect-error -- a called form without its query fails with the hint
    Widget({ size: WidgetSize.Small });
  });
});
