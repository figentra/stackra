/**
 * Stackra file contract:
 * Purpose: proves the Rating page sits at /pro-rating in the Pro category, titles the page and the document, draws the
 *          named rating input with its five stars and the read-only average, and reports the rating chosen.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProRating } from "#src/routes/pro-rating/pro-rating";
import { ProRatingRoute } from "#src/routes/pro-rating/pro-rating.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProRating", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-rating in the Pro category, and titles the page and the document", () => {
    render(<ProRating />);
    expect(routePath(ProRatingRoute)).toBe("/pro-rating");
    expect(ProRatingRoute.category).toBe("Feedback and status");
    expect(screen.getByRole("heading", { level: 1, name: ProRatingRoute.title })).toBeTruthy();
    expect(document.title).toBe("Rating · Stackra Playground");
  });

  it("draws the named input with five stars, and the read-only average", () => {
    render(<ProRating />);
    expect(screen.getByRole("radiogroup", { name: "Rate this release" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Average rating: 3.5 out of 5" })).toBeTruthy();
    expect(screen.getAllByRole("radio", { name: "3 stars" })).toHaveLength(2);
  });

  it("reports the rating chosen", () => {
    render(<ProRating />);
    expect(screen.getByRole("status").textContent).toBe("You rated it 3 stars.");
    const input = screen.getByRole("radiogroup", { name: "Rate this release" });
    fireEvent.click(input.querySelector('input[value="5"]') as HTMLElement);
    expect(screen.getByRole("status").textContent).toBe("You rated it 5 stars.");
  });
});
