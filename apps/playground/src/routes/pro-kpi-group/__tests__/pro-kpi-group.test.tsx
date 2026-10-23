/**
 * Stackra file contract:
 * Purpose: proves the KpiGroup page sits at /pro-kpi-group in the Pro group, titles the page and the document, draws
 *          a horizontal group of three cards and a vertical group of two, with formatted values and separators
 *          between the cards, and a trend that names its direction.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProKpiGroup } from "#src/routes/pro-kpi-group/pro-kpi-group";
import { ProKpiGroupRoute } from "#src/routes/pro-kpi-group/pro-kpi-group.route";

describe("ProKpiGroup", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-kpi-group in the Pro group, and titles the page and the document", () => {
    render(<ProKpiGroup />);
    expect(ProKpiGroupRoute.path).toBe("/pro-kpi-group");
    expect(ProKpiGroupRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProKpiGroupRoute.title })).toBeTruthy();
    expect(document.title).toBe("KpiGroup · Stackra Playground");
  });

  it("draws two groups of cards with their formatted values", () => {
    render(<ProKpiGroup />);
    expect(document.querySelectorAll('[data-slot="kpi-group"]')).toHaveLength(2);
    const values = [...document.querySelectorAll('[data-slot="kpi-value"]')];
    expect(values.map((value) => value.textContent)).toEqual([
      "71,897",
      "58.2%",
      "24.6%",
      "71,897",
      "58.2%",
    ]);
  });

  it("puts a separator between the cards, and names the direction of each trend", () => {
    render(<ProKpiGroup />);
    expect(document.querySelectorAll('[data-slot="kpi-group-separator"]')).toHaveLength(3);
    expect(screen.getAllByText("Trending up")).toHaveLength(4);
    expect(screen.getAllByText("Trending down")).toHaveLength(1);
  });
});
