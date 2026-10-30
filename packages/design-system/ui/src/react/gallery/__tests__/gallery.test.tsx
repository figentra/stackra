/**
 * Stackra file contract:
 * Purpose: proves the web Gallery is a named list of "Open <alt>" buttons, opens the pressed picture in the Lightbox
 *          and reports it, steps and closes there (opening again at the pressed picture), and opens nothing without a
 *          lightbox.
 * Boundary: jsdom; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Gallery } from "#react/gallery/gallery";

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte", width: 400, height: 600 },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
] as const;

describe("Gallery (web)", () => {
  it("opens the pressed picture in the lightbox", () => {
    const pressed: string[] = [];
    render(
      <Gallery
        images={IMAGES}
        label="Menu photos"
        layout="masonry"
        onImagePress={(id) => pressed.push(id)}
      />,
    );
    const list = screen.getByRole("list", { name: "Menu photos" });
    expect(list.getAttribute("data-layout")).toBe("masonry");
    fireEvent.click(screen.getByRole("button", { name: "Open Croissant" }));
    expect(pressed).toEqual(["b"]);
    expect(screen.getByRole("dialog").textContent).toContain("2 of 2");
  });

  it("steps through the pictures in the lightbox and closes it", () => {
    render(<Gallery images={IMAGES} label="Menu photos" />);
    fireEvent.click(screen.getByRole("button", { name: "Open Latte" }));
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByRole("dialog").textContent).toContain("2 of 2");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    // Opened again, it starts at the pressed picture.
    fireEvent.click(screen.getByRole("button", { name: "Open Latte" }));
    expect(screen.getByRole("dialog").textContent).toContain("1 of 2");
  });

  it("opens nothing without a lightbox", () => {
    render(<Gallery images={IMAGES} label="Menu photos" hasLightbox={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Open Latte" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
