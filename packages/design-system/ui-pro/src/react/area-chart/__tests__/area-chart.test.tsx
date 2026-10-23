/**
 * Stackra file contract:
 * Purpose: proves the web AreaChart hands HeroUI Pro's root the accessible name (`label` as `aria-label`), leaves it out
 *          when the caller did, passes every other prop through, carries HeroUI Pro's own parts, and refuses
 *          `aria-label`.
 * Boundary: recharts measures its box, which jsdom has none of, so the `@heroui-pro/react/area-chart` subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Pro is checked, not its drawing.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-001
import { AreaChart as HeroAreaChart } from "@heroui-pro/react/area-chart";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { AreaChartContractProps } from "#contracts/types/area-chart-contract-props.type";
import { AreaChart, type AreaChartProps } from "#react/area-chart/area-chart";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("@heroui-pro/react/area-chart", async () => {
  const { createElement } = await import("react");
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    AreaChart: Object.assign(root, {
      Root: root,
      Area: () => null,
      Grid: () => null,
      Tooltip: () => null,
      TooltipContent: () => null,
      XAxis: () => null,
      YAxis: () => null,
    }),
  };
});

describe("AreaChart (web)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("maps label to aria-label on HeroUI Pro's root", () => {
    render(
      <AreaChart data={[]} label="Revenue by month">
        <span />
      </AreaChart>,
    );
    expect(received.props).toMatchObject({ "aria-label": "Revenue by month" });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves aria-label out when the caller left out label", () => {
    render(
      <AreaChart data={[]}>
        <span />
      </AreaChart>,
    );
    expect(received.props).not.toHaveProperty("aria-label");
  });

  it("passes every other prop through unchanged", () => {
    render(
      <AreaChart data={[]} height={200} width="50%" className="extra" data-testid="found">
        <span />
      </AreaChart>,
    );
    expect(received.props).toMatchObject({
      height: 200,
      width: "50%",
      className: "extra",
      "data-testid": "found",
    });
  });

  it.each(["Area", "Grid", "Tooltip", "TooltipContent", "XAxis", "YAxis"] as const)(
    "carries HeroUI Pro's own %s",
    (name) => {
      expect(AreaChart[name]).toBe(HeroAreaChart[name]);
    },
  );

  it("extends its contract and refuses the name the contract owns", () => {
    expectTypeOf<AreaChartProps>().toExtend<AreaChartContractProps>();
    expectTypeOf<AreaChartProps>().not.toHaveProperty("aria-label");
  });
});
