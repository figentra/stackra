/**
 * Stackra file contract:
 * Purpose: proves the rest of the web Lightbox: it opens at `defaultIndex` or follows a controlled `index`; the
 *          previous button and End step; the zoom button toggles its name, stops the arrow keys and the swipe while
 *          zoomed, and a step leaves the zoom; a swipe of the picture changes it (towards the start goes forward,
 *          mirrored in Arabic) while a short one does not; the arrow keys mirror in right-to-left; with no pictures it
 *          shows none.
 * Boundary: jsdom with real React Aria; Arabic comes from `I18nProvider`; catalogue words stay English.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { Lightbox } from "#react/lightbox/lightbox";

const IMAGES = [
  { id: "a", src: "/a.jpg", alt: "Latte" },
  { id: "b", src: "/b.jpg", alt: "Croissant" },
  { id: "c", src: "/c.jpg", alt: "Beans" },
] as const;

const shown = () => screen.getByRole("dialog").querySelector("img")?.getAttribute("alt");
const stage = () => {
  const element = screen.getByRole("dialog").querySelector("img")?.parentElement;
  if (!element) throw new Error("no stage");
  return element;
};
const swipe = (from: number, to: number) => {
  fireEvent.pointerDown(stage(), { clientX: from });
  fireEvent.pointerUp(stage(), { clientX: to });
};
const key = (name: string) =>
  fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: name });

describe("Lightbox gestures (web)", () => {
  it("opens at defaultIndex and steps back and to the end", () => {
    render(<Lightbox images={IMAGES} isOpen defaultIndex={1} />);
    expect(shown()).toBe("Croissant");
    fireEvent.click(screen.getByRole("button", { name: "Previous image" }));
    expect(shown()).toBe("Latte");
    expect(screen.getByRole("button", { name: "Previous image" }).hasAttribute("disabled")).toBe(
      true,
    );
    key("End");
    expect(shown()).toBe("Beans");
  });

  it("follows a controlled index, clamped to the pictures", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(
      <Lightbox images={IMAGES} isOpen index={9} onIndexChange={onIndexChange} />,
    );
    expect(shown()).toBe("Beans");
    key("ArrowLeft");
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(shown()).toBe("Beans");
    rerender(<Lightbox images={IMAGES} isOpen index={1} onIndexChange={onIndexChange} />);
    expect(shown()).toBe("Croissant");
  });

  it("zooms, holds the keys and the swipe while zoomed, and a step leaves the zoom", () => {
    render(<Lightbox images={IMAGES} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeTruthy();
    key("ArrowRight");
    swipe(300, 100);
    expect(shown()).toBe("Latte");
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(shown()).toBe("Croissant");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeTruthy();
  });

  it("changes the picture on a swipe towards the start, not on a short one", () => {
    render(<Lightbox images={IMAGES} isOpen />);
    swipe(300, 280);
    expect(shown()).toBe("Latte");
    swipe(300, 100);
    expect(shown()).toBe("Croissant");
    swipe(100, 300);
    expect(shown()).toBe("Latte");
    // A pointer up with no pointer down before it moves nothing.
    fireEvent.pointerUp(stage(), { clientX: 0 });
    expect(shown()).toBe("Latte");
  });

  it("mirrors the swipe and the arrow keys in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <Lightbox images={IMAGES} isOpen />
      </I18nProvider>,
    );
    key("ArrowLeft");
    expect(shown()).toBe("Croissant");
    key("ArrowRight");
    expect(shown()).toBe("Latte");
    swipe(100, 300);
    expect(shown()).toBe("Croissant");
  });

  it("shows no picture when there are none", () => {
    render(<Lightbox images={[]} isOpen />);
    expect(screen.getByRole("dialog", { name: "Image viewer" }).querySelector("img")).toBeNull();
  });
});
