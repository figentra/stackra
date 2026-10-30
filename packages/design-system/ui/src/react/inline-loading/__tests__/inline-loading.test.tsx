/**
 * Stackra file contract:
 * Purpose: proves the web InlineLoading is one polite live region in every state, draws nothing while idle, a spinner
 *          while loading and a check or an alert with its text after, and passes the span's own props through.
 * Boundary: jsdom with real HeroUI and Motion; the swap animation is not timed, only its end state is checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { InlineLoading } from "#react/inline-loading/inline-loading";

const LABELS = { loadingLabel: "Charging card", successLabel: "Paid", errorLabel: "Card declined" };

describe("InlineLoading (web)", () => {
  it("is one live region that is empty while idle", () => {
    render(<InlineLoading status="idle" {...LABELS} />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");
    expect(region.getAttribute("data-status")).toBe("idle");
  });

  it("draws the state's text in the region, the spinner while loading", async () => {
    const { rerender } = render(<InlineLoading status="loading" {...LABELS} id="pay" />);
    expect(screen.getByRole("status").id).toBe("pay");
    expect(screen.getByRole("status").textContent).toContain("Charging card");
    rerender(<InlineLoading status="success" {...LABELS} id="pay" />);
    expect(await screen.findByText("Paid")).toBeTruthy();
    rerender(<InlineLoading status="error" {...LABELS} id="pay" />);
    expect(await screen.findByText("Card declined")).toBeTruthy();
  });
});
