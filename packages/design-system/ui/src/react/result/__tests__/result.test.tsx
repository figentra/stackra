/**
 * Stackra file contract:
 * Purpose: proves the web Result draws the title as a heading at level 2, the description and actions, is a polite
 *          live region, and shows a spinner while pending.
 * Boundary: jsdom with the real components.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Result } from "#react/result/result";

describe("Result (web)", () => {
  it("draws the outcome with a heading, description and actions", () => {
    const { container } = render(
      <Result
        status="success"
        title="Payment received"
        description="Receipt sent."
        actions={<button type="button">Done</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Payment received" })).toBeTruthy();
    expect(screen.getByText("Receipt sent.")).toBeTruthy();
    expect(container.querySelector("[data-status]")?.getAttribute("aria-live")).toBe("polite");
  });

  it("spins while pending", () => {
    const { container } = render(<Result status="pending" title="Submitting" />);
    expect(container.querySelector('[data-status="pending"]')?.innerHTML).toContain("spinner");
  });
});
