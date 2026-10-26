/**
 * Stackra file contract:
 * Purpose: proves the web BarChart hands HeroUI Pro's root the accessible name (`label` as `aria-label`), leaves it out
 *          when the caller did, passes every other prop through, carries HeroUI Pro's own parts, and refuses
 *          `aria-label`.
 * Boundary: recharts measures its box, which jsdom has none of, so the `@heroui-pro/react/bar-chart` subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Pro is checked, not its drawing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-001
import { BarChart as HeroBarChart } from "@heroui-pro/react/bar-chart";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { BarChartContractProps } from "#contracts/types/bar-chart-contract-props.type";
import { BarChart } from "#react/bar-chart/bar-chart";
import type { BarChartProps } from "#react/bar-chart/bar-chart.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("@heroui-pro/react/bar-chart", async () => {
  const { createElement } = await import("react");
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    BarChart: Object.assign(root, {
      Root: root,
      Bar: () => null,
      Grid: () => null,
      Tooltip: () => null,
      TooltipContent: () => null,
      XAxis: () => null,
      YAxis: () => null,
    }),
  };
});

describe("BarChart (web)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to aria-label on HeroUI Pro's root", () => {
    render(
      <BarChart data={[]} label="Revenue by month">
        <span />
      </BarChart>,
    );
    expect(received.props).toMatchObject({ "aria-label": "Revenue by month" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves aria-label out when the caller left out label", () => {
    render(
      <BarChart data={[]}>
        <span />
      </BarChart>,
    );
    expect(received.props).not.toHaveProperty("aria-label");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <BarChart data={[]} height={200} width="50%" className="extra" data-testid="found">
        <span />
      </BarChart>,
    );
    expect(received.props).toMatchObject({
      height: 200,
      width: "50%",
      className: "extra",
      "data-testid": "found",
    });
  });

  it.each(["Bar", "Grid", "Tooltip", "TooltipContent", "XAxis", "YAxis"] as const)(
    "carries HeroUI Pro's own %s",
    (name) => {
      expect(BarChart[name]).toBe(HeroBarChart[name]);
    },
  );

  it("extends its contract and refuses the name the contract owns", () => {
    expectTypeOf<BarChartProps>().toExtend<BarChartContractProps>();
    expectTypeOf<BarChartProps>().not.toHaveProperty("aria-label");
  });
});
