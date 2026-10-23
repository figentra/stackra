/**
 * Stackra file contract:
 * Purpose: proves the Kpi page sits at /pro-kpi in the Pro group, titles the page and the document, draws four cards
 *          with their formatted values, trends that name their direction, a progress bar on one, a named actions
 *          button on each, and keeps every `dt` and `dd` inside a `dl`.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProKpi } from "#src/routes/pro-kpi/pro-kpi";
import { ProKpiRoute } from "#src/routes/pro-kpi/pro-kpi.route";

describe("ProKpi", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-kpi in the Pro group, and titles the page and the document", () => {
    render(<ProKpi />);
    expect(ProKpiRoute.path).toBe("/pro-kpi");
    expect(ProKpiRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProKpiRoute.title })).toBeTruthy();
    expect(document.title).toBe("Kpi · Stackra Playground");
  });

  it("draws four cards with their titles and formatted values", () => {
    render(<ProKpi />);
    const titles = [...document.querySelectorAll('[data-slot="kpi-title"]')];
    expect(titles.map((title) => title.textContent)).toEqual([
      "Revenue",
      "Active users",
      "Refund rate",
      "Storage used",
    ]);
    const values = [...document.querySelectorAll('[data-slot="kpi-value"]')];
    expect(values.map((value) => value.textContent)).toEqual(["$128,450", "3,482", "2.1%", "72%"]);
  });

  it("names the direction of each trend and tints each icon by tone", () => {
    render(<ProKpi />);
    const trends = [...document.querySelectorAll("[data-trend]")];
    expect(trends.map((trend) => trend.getAttribute("data-trend"))).toEqual([
      "up",
      "up",
      "down",
      "neutral",
    ]);
    expect(trends.map((trend) => trend.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "+8.2% Trending up",
      "+1.4% Trending up",
      "-0.4% Trending down",
      "0.0% No change",
    ]);
    const tones = [...document.querySelectorAll('[data-slot="kpi-icon"]')];
    expect(tones.map((icon) => icon.getAttribute("data-status"))).toEqual([
      "success",
      "success",
      "danger",
      "warning",
    ]);
  });

  it("draws a progress bar on the storage card only, and a named actions button on every card", () => {
    render(<ProKpi />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars).toHaveLength(1);
    expect(bars[0]?.getAttribute("aria-valuenow")).toBe("72");
    expect(
      screen.getAllByRole("button").map((button) => button.getAttribute("aria-label")),
    ).toEqual(
      ["Revenue", "Active users", "Refund rate", "Storage used"].map(
        (title) => `Actions for ${title}`,
      ),
    );
  });

  it("keeps every dt and dd inside a dl", () => {
    render(<ProKpi />);
    for (const term of document.querySelectorAll("dt, dd"))
      expect(term.parentElement?.tagName).toBe("DL");
  });
});
