/**
 * Stackra file contract:
 * Purpose: proves the web Carousel names its slides "Slide n of m" and, with `thumbnails`, draws a pressable picture
 *          per slide in place of the dots, the first marked current.
 * Boundary: jsdom; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Carousel } from "#react/carousel/carousel";

describe("Carousel (web)", () => {
  it("draws a thumbnail per slide in place of the dots", () => {
    const { container } = render(
      <Carousel label="Photos" thumbnails={["/a.jpg", "/b.jpg"]}>
        {[<p key="a">A</p>, <p key="b">B</p>]}
      </Carousel>,
    );
    expect(screen.getByRole("region", { name: "Photos" })).toBeTruthy();
    const strip = container.querySelector("[data-slot=carousel-thumbnails]");
    expect(strip?.querySelectorAll("img")).toHaveLength(2);
    const current = screen.getAllByRole("button", { name: "Slide 1 of 2" });
    expect(current.some((button) => button.getAttribute("aria-current") === "true")).toBe(true);
  });
});
