/**
 * Stackra file contract:
 * Purpose: proves the web Thumbnail is decorative without `alt` and one named image with it, sizes itself by `size`
 *          and `aspectRatio`, draws the blurred placeholder and hides the image until it loads, falls back to an icon
 *          with no image or a broken one, restarts on a new `src` and passes its root props through.
 * Boundary: jsdom never loads images, so `load` and `error` are fired by hand; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 12.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Thumbnail } from "#react/thumbnail/thumbnail";

const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-slot=thumbnail]");
const image = (container: HTMLElement) =>
  container.querySelector<HTMLImageElement>("[data-slot=thumbnail-image]");

describe("Thumbnail (web)", () => {
  it("is hidden without alt, and one image named by it", () => {
    const { container, rerender } = render(<Thumbnail src="/latte.jpg" />);
    expect(root(container)?.getAttribute("aria-hidden")).toBe("true");
    rerender(<Thumbnail src="/latte.jpg" alt="Iced latte" />);
    expect(screen.getByRole("img", { name: "Iced latte" })).toBe(root(container));
  });

  it("sizes its box by size and aspect ratio", () => {
    const { container, rerender } = render(<Thumbnail />);
    expect(root(container)?.style.width).toBe("64px");
    rerender(<Thumbnail size="lg" aspectRatio={4 / 3} style={{ opacity: 0.5 }} id="t" />);
    expect(root(container)?.style.width).toBe("96px");
    expect(root(container)?.style.aspectRatio).toMatch(/^1\.333/u);
    expect(root(container)?.style.opacity).toBe("0.5");
    expect(root(container)?.id).toBe("t");
  });

  it("shows the placeholder and fades the image in once it loads", () => {
    const { container } = render(<Thumbnail src="/latte.jpg" placeholderSrc="/latte-8px.jpg" />);
    expect(container.querySelector("[data-slot=thumbnail-placeholder]")?.getAttribute("src")).toBe(
      "/latte-8px.jpg",
    );
    expect(image(container)?.style.opacity).toBe("0");
    fireEvent.load(image(container) as HTMLImageElement);
    expect(image(container)?.style.opacity).toBe("1");
    expect(root(container)?.dataset["status"]).toBe("loaded");
  });

  it("falls back to an icon with no image or a broken one, and restarts on a new src", () => {
    const { container, rerender } = render(<Thumbnail />);
    expect(image(container)).toBeNull();
    expect(root(container)?.dataset["status"]).toBe("empty");
    rerender(<Thumbnail src="/missing.jpg" />);
    fireEvent.error(image(container) as HTMLImageElement);
    expect(image(container)).toBeNull();
    expect(root(container)?.dataset["status"]).toBe("error");
    rerender(<Thumbnail src="/other.jpg" />);
    expect(image(container)?.getAttribute("src")).toBe("/other.jpg");
    expect(root(container)?.dataset["status"]).toBe("loading");
  });

  it("draws the caller's fallback element", () => {
    render(<Thumbnail fallback={<b data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
  });
});
