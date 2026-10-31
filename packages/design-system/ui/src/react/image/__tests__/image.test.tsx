/**
 * Stackra file contract:
 * Purpose: proves the web Image is the Thumbnail at full width with a caption, named by `alt`, and that a zoomable
 *          one is a button that opens the Lightbox.
 * Boundary: jsdom with the real HeroUI components; images never load in jsdom.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Image } from "#react/image/image";

describe("Image (web)", () => {
  it("fills the width at its ratio with a caption", () => {
    const { container } = render(
      <Image src="/souq.jpg" alt="Souq Waqif" caption="Doha, at dusk" />,
    );
    const picture = screen.getByRole("img", { name: "Souq Waqif" });
    expect(picture.style.width).toBe("100%");
    expect(picture.style.aspectRatio).toMatch(/^1\.77/u);
    expect(container.querySelector("figcaption")?.textContent).toBe("Doha, at dusk");
    expect(container.querySelector("img[data-slot=thumbnail-image]")?.getAttribute("loading")).toBe(
      "lazy",
    );
  });

  it("opens the lightbox when zoomable", () => {
    render(<Image src="/souq.jpg" alt="Souq Waqif" isZoomable />);
    fireEvent.click(screen.getByRole("button", { name: "Open Souq Waqif" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("is not zoomable without alt", () => {
    render(<Image src="/souq.jpg" isZoomable />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
