/**
 * Stackra file contract:
 * Purpose: proves the web StackedMeter: a group named by its label that writes the used total against the maximum, draws
 *          a bar only for segments with a share, lists each segment in a legend (or none when turned off), and writes
 *          its numbers in the locale.
 * Boundary: jsdom; the segment widths are inline styles, checked as such.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { StackedMeter } from "#react/stacked-meter/stacked-meter";

const SEGMENTS = [
  { key: "photos", label: "Photos", value: 30 },
  { key: "mail", label: "Mail", value: 0, color: "warning" as const },
  { key: "docs", label: "Docs", value: 20 },
];

describe("StackedMeter (web)", () => {
  it("names the group, writes used of max, and draws a bar per non-empty segment", () => {
    const { container } = render(<StackedMeter segments={SEGMENTS} label="Storage" max={100} />);
    const group = screen.getByRole("group", { name: "Storage" });
    expect(group.textContent).toContain("50 of 100");
    const bars = container.querySelectorAll<HTMLElement>("[aria-hidden] > span");
    expect([...bars].map((bar) => bar.style.width)).toEqual(["30%", "20%"]);
    expect(
      within(screen.getByRole("list"))
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Photos30", "Mail0", "Docs20"]);
  });

  it("uses the total as the maximum without one, hides the legend, and writes the locale's digits", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <StackedMeter
          segments={SEGMENTS}
          label="Storage"
          showLegend={false}
          palette="categorical"
        />
      </I18nProvider>,
    );
    expect(screen.getByRole("group", { name: "Storage" }).textContent).toContain("٥٠");
    expect(screen.queryByRole("list")).toBeNull();
  });
});
