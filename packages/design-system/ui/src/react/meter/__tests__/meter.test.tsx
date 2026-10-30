/**
 * Stackra file contract:
 * Purpose: proves the web Meter is a `meter` named by its label with the value text, and takes the tone of
 *          `meterToneOf`.
 * Boundary: jsdom with the real HeroUI and React Aria components.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Meter } from "#react/meter/meter";

describe("Meter (web)", () => {
  it("is a named meter with its value text and tone", () => {
    const { container } = render(<Meter label="Storage" value={92} low={60} high={85} optimum={0} />);
    const meter = screen.getByRole("meter", { name: "Storage" });
    expect(meter.getAttribute("aria-valuenow")).toBe("92");
    expect(meter.getAttribute("aria-valuetext")).toBe("92%");
    expect(container.querySelector("[data-tone]")?.getAttribute("data-tone")).toBe("danger");
  });

  it("writes `valueLabel` in place of the number", () => {
    render(<Meter label="Seats" value={8} maxValue={10} valueLabel="8 of 10 seats" />);
    expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("8 of 10 seats");
  });
});
