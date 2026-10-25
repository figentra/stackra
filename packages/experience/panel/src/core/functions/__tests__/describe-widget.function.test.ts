/**
 * Stackra file contract:
 * Purpose: unit tests of `describeWidget`: a class that is not a widget is refused, and the options are recorded without
 *          the layer and base.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5 and 14).
 */
import { describe, expect, it } from "@stackra/testing";

import { Widget } from "#core/bases/widget.base";
import { WidgetSize } from "#core/enums/widget-size.enum";
import { describeWidget } from "#core/functions/describe-widget.function";
import type { Display } from "#core/types/display.type";

class BalanceQuery {
  async handle(_input: { readonly accountId: string }): Promise<{ readonly balance: number }> {
    return { balance: 0 };
  }
}

class BalanceWidget extends Widget<BalanceQuery>({ size: WidgetSize.Medium }) {
  display(d: Display<{ readonly balance: number }>) {
    return d.custom();
  }
}

describe("describeWidget", () => {
  it("refuses a class that is not a widget", () => {
    expect(() => describeWidget(class {})).toThrow(TypeError);
  });

  it("records the options and the display", () => {
    expect(describeWidget(BalanceWidget)).toEqual({
      options: { size: "medium" },
      layer: "1",
      display: { kind: "custom" },
    });
  });
});
