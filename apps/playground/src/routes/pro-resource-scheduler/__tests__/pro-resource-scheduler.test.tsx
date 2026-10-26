/**
 * Stackra file contract:
 * Purpose: proves the Resource scheduler page sits at /pro-resource-scheduler, titles the page and the document, draws
 *          a column per chair with its bookings as buttons, and accepts a keyboard move, announcing it.
 * Boundary: jsdom; the scheduler is the package's own markup, so no browser API needs a stub.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1; ADR 0022 (test placement).
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { ProResourceScheduler } from "#src/routes/pro-resource-scheduler/pro-resource-scheduler";
import { ProResourceSchedulerRoute } from "#src/routes/pro-resource-scheduler/pro-resource-scheduler.route";

describe("ProResourceScheduler", () => {
  it("sits at /pro-resource-scheduler, and titles the page and the document", () => {
    render(<ProResourceScheduler />);
    expect(ProResourceSchedulerRoute.path).toBe("/pro-resource-scheduler");
    expect(
      screen.getByRole("heading", { level: 1, name: ProResourceSchedulerRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("Resource scheduler · Stackra Playground");
  });

  it("moves a booking with the keyboard and announces it", () => {
    render(<ProResourceScheduler />);
    expect(screen.getAllByRole("list")).toHaveLength(3);
    const booking = screen.getByRole("button", { name: /^Blow-dry, Mona, Nour/ });
    fireEvent.keyDown(booking, { key: "ArrowDown" });
    expect(screen.getByRole("status").textContent).toBe("Moved Blow-dry, Mona");
    expect(screen.getByRole("button", { name: /09:45 – 10:30$/ })).toBeTruthy();
  });
});
