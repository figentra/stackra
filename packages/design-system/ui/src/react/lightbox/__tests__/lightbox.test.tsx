/**
 * Stackra file contract:
 * Purpose: proves the web Lightbox is a named dialog showing "1 of 3", steps with its buttons and the arrow keys,
 *          reports the new position, and closes from its close button.
 * Boundary: jsdom; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Lightbox } from "#react/lightbox/lightbox";

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte", caption: "Morning latte" },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
  { id: "c", src: "/c.jpg", alt: "Beans" },
] as const;

describe("Lightbox (web)", () => {
  it("steps through the pictures and reports the position", () => {
    const seen: number[] = [];
    render(
      <Lightbox images={IMAGES} isOpen label="Menu photos" onIndexChange={(at) => seen.push(at)} />,
    );
    const dialog = screen.getByRole("dialog", { name: "Menu photos" });
    expect(dialog.textContent).toContain("1 of 3");
    expect(screen.getByRole("img", { name: "Latte" })).toBeTruthy();
    expect(dialog.textContent).toContain("Morning latte");
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByRole("img", { name: "Croissant" })).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "ArrowRight" });
    expect(dialog.textContent).toContain("3 of 3");
    expect(screen.getByRole("button", { name: "Next image" }).hasAttribute("disabled")).toBe(true);
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Home" });
    expect(seen).toEqual([1, 2, 0]);
  });

  it("closes from the close button", () => {
    const changes: boolean[] = [];
    render(<Lightbox images={IMAGES} isOpen onOpenChange={(isOpen) => changes.push(isOpen)} />);
    expect(screen.getByRole("dialog", { name: "Image viewer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(changes).toEqual([false]);
  });
});
