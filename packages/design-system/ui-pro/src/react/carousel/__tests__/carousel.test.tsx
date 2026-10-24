/**
 * Stackra file contract:
 * Purpose: proves the web Carousel maps `label` to `aria-label` on its region, leaves the name out when none is
 *          given, passes unknown props through, draws its slides, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and Embla; `ResizeObserver`, `IntersectionObserver` and `matchMedia` are
 *          stubbed because jsdom has none of them and Embla measures through them; no layout is computed, so slide
 *          positions are not checked.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { Carousel as HeroCarousel } from "@heroui-pro/react/carousel";
import { render, screen } from "@testing-library/react";

import { Carousel, type CarouselProps } from "#react/carousel/carousel";

describe("Carousel (web)", () => {
  beforeEach(() => {
    class Observer {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", Observer);
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("maps label to the aria-label of the carousel region", () => {
    render(
      <Carousel label="Featured products">
        <Carousel.Content>
          <Carousel.Item>One</Carousel.Item>
        </Carousel.Content>
      </Carousel>,
    );
    const region = screen.getByRole("region", { name: "Featured products" });
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    expect(screen.getByText("One")).toBeTruthy();
  });

  it("leaves the name out when no label is given", () => {
    render(<Carousel data-testid="carousel" />);
    expect(screen.getByTestId("carousel").hasAttribute("aria-label")).toBe(false);
  });

  it("passes unknown props through", () => {
    render(<Carousel data-testid="carousel" className="extra" type="miniatures" />);
    const carousel = screen.getByTestId("carousel");
    expect(carousel.classList.contains("extra")).toBe(true);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Content",
      "Item",
      "Previous",
      "Next",
      "Dots",
      "Thumbnails",
      "Thumbnail",
    ] as const) {
      expect(Carousel[part]).toBe(HeroCarousel[part]);
    }
  });

  it("lets label win over a stray aria-label, and types label", () => {
    render(<Carousel label="Mapped" {...{ "aria-label": "Stray" }} />);
    expect(screen.getByRole("region", { name: "Mapped" })).toBeTruthy();
    expectTypeOf<CarouselProps>().toHaveProperty("label");
  });
});
