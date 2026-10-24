/**
 * Stackra file contract:
 * Purpose: proves the web ComposedChart hands HeroUI Pro's root the accessible name (`label` as `aria-label`), leaves it out
 *          when the caller did, passes every other prop through, carries HeroUI Pro's own parts, and refuses
 *          `aria-label`.
 * Boundary: recharts measures its box, which jsdom has none of, so the `@heroui-pro/react/composed-chart` subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Pro is checked, not its drawing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-001
import { ComposedChart as HeroComposedChart } from "@heroui-pro/react/composed-chart";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ComposedChartContractProps } from "#contracts/types/composed-chart-contract-props.type";
import { ComposedChart, type ComposedChartProps } from "#react/composed-chart/composed-chart";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("@heroui-pro/react/composed-chart", async () => {
  const { createElement } = await import("react");
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    ComposedChart: Object.assign(root, {
      Root: root,
      Area: () => null,
      Bar: () => null,
      Grid: () => null,
      Line: () => null,
      Tooltip: () => null,
      TooltipContent: () => null,
      XAxis: () => null,
      YAxis: () => null,
    }),
  };
});

describe("ComposedChart (web)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to aria-label on HeroUI Pro's root", () => {
    render(
      <ComposedChart data={[]} label="Revenue by month">
        <span />
      </ComposedChart>,
    );
    expect(received.props).toMatchObject({ "aria-label": "Revenue by month" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves aria-label out when the caller left out label", () => {
    render(
      <ComposedChart data={[]}>
        <span />
      </ComposedChart>,
    );
    expect(received.props).not.toHaveProperty("aria-label");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <ComposedChart data={[]} height={200} width="50%" className="extra" data-testid="found">
        <span />
      </ComposedChart>,
    );
    expect(received.props).toMatchObject({
      height: 200,
      width: "50%",
      className: "extra",
      "data-testid": "found",
    });
  });

  it.each(["Area", "Bar", "Grid", "Line", "Tooltip", "TooltipContent", "XAxis", "YAxis"] as const)(
    "carries HeroUI Pro's own %s",
    (name) => {
      expect(ComposedChart[name]).toBe(HeroComposedChart[name]);
    },
  );

  it("extends its contract and refuses the name the contract owns", () => {
    expectTypeOf<ComposedChartProps>().toExtend<ComposedChartContractProps>();
    expectTypeOf<ComposedChartProps>().not.toHaveProperty("aria-label");
  });
});
