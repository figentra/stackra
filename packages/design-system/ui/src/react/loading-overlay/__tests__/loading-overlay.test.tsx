/**
 * Stackra file contract:
 * Purpose: proves the web LoadingOverlay marks the region busy, makes the content inert and says the message as a
 *          status while loading, and leaves the content alone when not.
 * Boundary: jsdom; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { LoadingOverlay } from "#react/loading-overlay/loading-overlay";

describe("LoadingOverlay (web)", () => {
  it("blocks the content and says why while loading", () => {
    const { container } = render(
      <LoadingOverlay isLoading message="Saving the price list…">
        <button type="button">Edit</button>
      </LoadingOverlay>,
    );
    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("button", { hidden: true }).closest("[inert]")).toBeTruthy();
    expect(screen.getAllByRole("status").some((s) => s.textContent?.includes("Saving the price list…"))).toBe(true);
  });

  it("leaves the content alone when not loading", () => {
    render(
      <LoadingOverlay isLoading={false}>
        <button type="button">Edit</button>
      </LoadingOverlay>,
    );
    expect(screen.getByRole("button", { name: "Edit" }).closest("[inert]")).toBeNull();
    expect(screen.queryByText("Loading…")).toBeNull();
  });
});
