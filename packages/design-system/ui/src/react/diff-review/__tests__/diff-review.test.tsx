/**
 * Stackra file contract:
 * Purpose: proves the web `DiffReview` counts what is left, accepts all, and applies only once every change has an
 *          answer.
 * Boundary: jsdom with real HeroUI and English words.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { DiffReview } from "#react/diff-review/diff-review";

const CHANGES = [
  { id: "price", label: "Price", before: "10", after: "12" },
  { id: "zone", label: "Zone", before: null, after: "Gulf" },
];

describe("DiffReview (web)", () => {
  it("accepts all the pending changes", () => {
    const onDecisionsChange = vi.fn();
    render(
      <DiffReview
        label="Feed"
        changes={CHANGES}
        decisions={{ zone: "rejected" }}
        onDecisionsChange={onDecisionsChange}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("1 left to review");
    expect(screen.getByText("Not set")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));
    expect(onDecisionsChange).toHaveBeenCalledWith({ price: "accepted", zone: "rejected" });
  });

  it("applies once every change is answered", () => {
    const onApply = vi.fn();
    const decisions = { price: "accepted", zone: "rejected" } as const;
    render(
      <DiffReview
        label="Feed"
        changes={CHANGES}
        decisions={decisions}
        onDecisionsChange={() => undefined}
        onApply={onApply}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply changes" }));
    expect(onApply).toHaveBeenCalledWith(decisions);
  });
});
