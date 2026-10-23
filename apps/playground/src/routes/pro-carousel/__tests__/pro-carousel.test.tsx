/**
 * Stackra file contract:
 * Purpose: proves the Carousel page sits at /pro-carousel in the Pro group, titles the page and the document, names
 *          the carousel, draws its five slides, and gives the previous and next buttons accessible names.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither, as is `IntersectionObserver`, which the slide engine observes with. Swiping and the loop are
 *          checked in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCarousel } from "#src/routes/pro-carousel/pro-carousel";
import { ProCarouselRoute } from "#src/routes/pro-carousel/pro-carousel.route";

describe("ProCarousel", () => {
  beforeEach(() => {
    stubBrowserApis();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-carousel in the Pro group, and titles the page and the document", () => {
    render(<ProCarousel />);
    expect(ProCarouselRoute.path).toBe("/pro-carousel");
    expect(ProCarouselRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProCarouselRoute.title })).toBeTruthy();
    expect(document.title).toBe("Carousel · Stackra Playground");
  });

  it("names the carousel and draws its five slides", () => {
    render(<ProCarousel />);
    expect(screen.getByRole("region", { name: "Highlights carousel" })).toBeTruthy();
    expect(screen.getAllByRole("group", { name: /^Slide \d of 5$/ })).toHaveLength(5);
  });

  it("names the previous and next buttons", () => {
    render(<ProCarousel />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next/i })).toBeTruthy();
  });
});
