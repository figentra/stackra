/**
 * Stackra file contract:
 * Purpose: proves the web EmptyState draws its placeholder, passes `size`, `variant` and unknown props through
 *          unchanged, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro; the theme CSS is not loaded, so attributes and classes are checked, not
 *          looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { EmptyState as HeroEmptyState } from "@heroui-pro/react/empty-state";
import { render, screen } from "@testing-library/react";

import { EmptyState } from "#react/empty-state/empty-state";

describe("EmptyState (web)", () => {
  it("draws the placeholder in HeroUI Pro's parts", () => {
    render(
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media variant="icon">i</EmptyState.Media>
          <EmptyState.Title>No results</EmptyState.Title>
          <EmptyState.Description>Try another search.</EmptyState.Description>
        </EmptyState.Header>
        <EmptyState.Content>
          <button type="button">Clear</button>
        </EmptyState.Content>
      </EmptyState>,
    );
    expect(screen.getByRole("heading", { name: "No results" })).toBeTruthy();
    expect(screen.getByText("Try another search.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("passes size and unknown props through, and keeps HeroUI Pro's default without a size", () => {
    const { rerender } = render(
      <EmptyState size="lg" className="extra" data-testid="empty">
        x
      </EmptyState>,
    );
    const large = screen.getByTestId("empty");
    expect(large.classList.contains("extra")).toBe(true);
    const largeHtml = large.outerHTML;
    rerender(
      <EmptyState className="extra" data-testid="empty">
        x
      </EmptyState>,
    );
    expect(screen.getByTestId("empty").outerHTML).not.toBe(largeHtml);
    rerender(
      <HeroEmptyState.Root size="lg" className="extra" data-testid="empty">
        x
      </HeroEmptyState.Root>,
    );
    expect(screen.getByTestId("empty").outerHTML).toBe(largeHtml);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of ["Header", "Media", "Title", "Description", "Content"] as const) {
      expect(EmptyState[part]).toBe(HeroEmptyState[part]);
    }
  });
});
