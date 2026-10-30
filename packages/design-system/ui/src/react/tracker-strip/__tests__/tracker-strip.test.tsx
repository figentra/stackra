/**
 * Stackra file contract:
 * Purpose: proves the web `TrackerStrip`: one focusable image named by its label and worked-out uptime, every period
 *          read from the hidden list, and the arrow keys moving the readout in the reading direction (from the right
 *          in Arabic), Escape closing it.
 * Boundary: jsdom; the direction comes from React Aria's I18nProvider.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0060; WCAG 2.2 SC 1.4.1 and 2.1.1; STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { TrackerCell } from "#contracts/types/tracker-cell.type";
import { TrackerStrip } from "#react/tracker-strip/tracker-strip";

/** Four days: up, degraded, down, no data. */
const CELLS: readonly TrackerCell[] = [
  { key: "d1", label: "1 Oct", status: "up" },
  { key: "d2", label: "2 Oct", status: "degraded" },
  { key: "d3", label: "3 Oct", status: "down", note: "Checkout errors" },
  { key: "d4", label: "4 Oct", status: "none" },
];

describe("TrackerStrip (web)", () => {
  it("is one image named by its label and the uptime, with every period in the hidden list", () => {
    const { container } = render(
      <TrackerStrip cells={CELLS} label="API" startLabel="4 days ago" endLabel="Today" />,
    );
    const strip = screen.getByRole("img");
    expect(strip.getAttribute("aria-label")).toBe("API. 66.67% uptime");
    expect(strip.tabIndex).toBe(0);
    const items = [...container.querySelectorAll("ul li")].map((item) => item.textContent);
    expect(items).toEqual([
      "1 Oct: Operational",
      "2 Oct: Degraded",
      "3 Oct: Down. Checkout errors",
      "4 Oct: No data",
    ]);
    expect(screen.getByText("4 days ago")).toBeTruthy();
  });

  it("takes the caller's summary over the worked-out one", () => {
    render(<TrackerStrip cells={CELLS} label="API" summary="All good" />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("API. All good");
  });

  it("moves the readout with the arrow keys and closes it with Escape", () => {
    render(<TrackerStrip cells={CELLS} label="API" />);
    const strip = screen.getByRole("img");
    fireEvent.keyDown(strip, { key: "End" });
    expect(screen.getByRole("status").textContent).toBe("4 OctNo data");
    fireEvent.keyDown(strip, { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toBe("3 OctDownCheckout errors");
    fireEvent.keyDown(strip, { key: "Escape" });
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("runs the arrow keys from the right in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <TrackerStrip cells={CELLS} label="API" />
      </I18nProvider>,
    );
    const strip = screen.getByRole("img");
    fireEvent.keyDown(strip, { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toContain("1 Oct");
    fireEvent.keyDown(strip, { key: "ArrowLeft" });
    expect(screen.getByRole("status").textContent).toContain("2 Oct");
  });
});
