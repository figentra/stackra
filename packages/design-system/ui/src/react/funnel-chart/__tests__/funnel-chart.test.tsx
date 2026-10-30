/**
 * Stackra file contract:
 * Purpose: proves the web FunnelChart: a figure captioned by its label with one ordered step per stage, each written
 *          in the locale with its conversion from the step before (none for the first, none when turned off), and
 *          sorted on request.
 * Boundary: jsdom; the bar widths are inline styles, checked as such.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { FunnelChart } from "#react/funnel-chart/funnel-chart";

const STAGES = [
  { key: "visit", label: "Visits", value: 1000 },
  { key: "cart", label: "Carts", value: 250 },
  { key: "buy", label: "Orders", value: 100 },
];

describe("FunnelChart (web)", () => {
  it("lists each step with its value and its conversion from the step before", () => {
    const { container } = render(<FunnelChart stages={STAGES} label="Checkout" />);
    expect(container.querySelector("figcaption")?.textContent).toBe("Checkout");
    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      "Visits1,000",
      "Carts25025% of the step before",
      "Orders10040% of the step before",
    ]);
    expect(steps[0]?.querySelector<HTMLElement>("[style]")?.style.width).toBe("100%");
  });

  it("hides the conversion when asked and sorts the steps", () => {
    render(
      <I18nProvider locale="ar-u-nu-arab">
        <FunnelChart
          stages={STAGES}
          label="Checkout"
          showConversion={false}
          sort="value-asc"
          color="success"
        />
      </I18nProvider>,
    );
    const steps = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(steps.map((step) => step.firstChild?.textContent)).toEqual([
      "Orders",
      "Carts",
      "Visits",
    ]);
    expect(steps[0]?.textContent).toBe("Orders١٠٠");
  });
});
