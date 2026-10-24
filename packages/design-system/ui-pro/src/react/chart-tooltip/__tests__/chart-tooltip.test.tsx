/**
 * Stackra file contract:
 * Purpose: proves the web ChartTooltip is HeroUI Pro's own ChartTooltip, so every prop and part reaches it unchanged.
 * Boundary: the `@heroui-pro/react/chart-tooltip` subpath is replaced by a recording stand-in, as for every web chart;
 *          the wrapper adds nothing, so the check is that what the app imports is what HeroUI Pro exports.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-001
import { ChartTooltip as HeroChartTooltip } from "@heroui-pro/react/chart-tooltip";

import { ChartTooltip } from "#react/chart-tooltip/chart-tooltip";

vi.mock("@heroui-pro/react/chart-tooltip", () => ({
  ChartTooltip: Object.assign(() => null, { Content: () => null, Item: () => null }),
}));

describe("ChartTooltip (web)", () => {
  it("is HeroUI Pro's own component, with its parts", () => {
    expect(ChartTooltip).toBe(HeroChartTooltip);
    expect(ChartTooltip.Content).toBe(HeroChartTooltip.Content);
    expect(ChartTooltip.Item).toBe(HeroChartTooltip.Item);
  });
});
