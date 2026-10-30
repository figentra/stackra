/**
 * Stackra file contract:
 * Purpose: proves the web PolarChart is one image named by its label with its numbers in a data table, draws one
 *          slice per row and series (none for a missing value), names each sector round the edge, shows the tooltip
 *          of the pointed sector, and keeps its legend for two series.
 * Boundary: jsdom with real HeroUI and React Aria's I18nProvider.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { PolarChart } from "#react/polar-chart/polar-chart";

const DATA = [
  { day: "Sat", store: 1200, online: 800 },
  { day: "Sun", store: 900, online: 1500 },
  { day: "Mon", store: 400 },
];
const SERIES = [
  { key: "store", label: "In store" },
  { key: "online", label: "Online" },
];

describe("PolarChart (web)", () => {
  it("is one named image with its numbers in a table", () => {
    const { container } = render(
      <PolarChart data={DATA} series={SERIES} xKey="day" label="Orders by weekday" />,
    );
    const image = screen.getByRole("img", { name: "Orders by weekday" });
    // Five drawn slices (Mon has no online value) and three hit areas.
    expect(image.querySelectorAll("path[fill^='var(']")).toHaveLength(5);
    expect(image.querySelectorAll("path[fill='transparent']")).toHaveLength(3);
    expect(
      within(screen.getByRole("table"))
        .getAllByRole("row")
        .map((row) => row.textContent),
    ).toEqual(["CategoryIn storeOnline", "Sat1,200800", "Sun9001,500", "Mon400"]);
    expect([...image.querySelectorAll("text")].map((node) => node.textContent)).toEqual([
      "Sat",
      "Sun",
      "Mon",
    ]);
    expect(container.querySelector("[data-slot='chart-legend']")?.textContent).toBe(
      "In storeOnline",
    );
  });

  it("shows the pointed sector's values in the tooltip", () => {
    const { container } = render(
      <PolarChart data={DATA} series={SERIES} xKey="day" label="Orders" />,
    );
    const hits = container.querySelectorAll("path[fill='transparent']");
    fireEvent.pointerEnter(hits[1] as Element);
    expect(container.querySelector("[data-slot='chart-tooltip']")?.textContent).toBe(
      "SunIn store900Online1,500",
    );
    fireEvent.pointerLeave(screen.getByRole("img"));
    expect(container.querySelector("[data-slot='chart-tooltip']")).toBeNull();
  });

  it("writes names and numbers in the locale and keeps names outside the ring in Arabic", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <PolarChart
          data={DATA.slice(0, 2)}
          series={SERIES.slice(0, 1)}
          xKey="day"
          label="الطلبات"
        />
      </I18nProvider>,
    );
    const names = [...screen.getByRole("img").querySelectorAll("text")];
    // Sat sits at the right of the ring: outward is `end` in a right-to-left text run.
    expect(names[0]?.getAttribute("text-anchor")).toBe("end");
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("١٬٢٠٠");
  });
});
