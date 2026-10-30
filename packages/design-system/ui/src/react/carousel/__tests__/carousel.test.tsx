/**
 * Stackra file contract:
 * Purpose: proves the web Carousel: a labelled carousel region of labelled slides with a focusable scroll viewport;
 *          the arrows and dots scroll the chosen slide into view, a scroll moves the current dot and reports the
 *          index (also when scrollLeft runs negative in RTL), and the arrows disable at the ends; dots and arrows can
 *          be turned off.
 * Boundary: jsdom has no layout, so `scrollIntoView` is stubbed and the viewport's width and scroll are set by hand.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { Carousel } from "#react/carousel/carousel";

const press = (element: HTMLElement) => act(() => element.click());
const SLIDES = [<p key="a">A</p>, <p key="b">B</p>, <p key="c">C</p>];

const scrollTo = (viewport: HTMLElement, left: number) => {
  Object.defineProperty(viewport, "clientWidth", { value: 100, configurable: true });
  Object.defineProperty(viewport, "scrollLeft", { value: left, configurable: true });
  fireEvent.scroll(viewport);
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Carousel (web)", () => {
  it("is a labelled carousel of labelled slides with a focusable viewport", () => {
    const { container } = render(<Carousel label="Offers">{SLIDES}</Carousel>);
    const region = screen.getByRole("region", { name: "Offers" });
    expect(region.getAttribute("aria-roledescription")).toBe("carousel");
    const slide = screen.getAllByRole("group", { name: "Slide 2 of 3" })[0];
    expect(slide?.getAttribute("aria-roledescription")).toBe("slide");
    expect(container.querySelector('[tabindex="0"]')).not.toBeNull();
  });

  it("scrolls to a slide from the dots and the arrows", () => {
    render(<Carousel label="Offers">{SLIDES}</Carousel>);
    const dots = screen.getByRole("group", { name: "Choose a slide" });
    press(within(dots).getByRole("button", { name: "Slide 3 of 3" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ inline: "start" }),
    );
    const previous = screen.getByRole("button", { name: "Previous slide" });
    expect(
      previous.hasAttribute("disabled") || previous.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    press(screen.getByRole("button", { name: "Next slide" }));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("follows the scroll position, in either direction, and reports the index", () => {
    const onIndexChange = vi.fn();
    const { container } = render(
      <Carousel label="Offers" onIndexChange={onIndexChange}>
        {SLIDES}
      </Carousel>,
    );
    const viewport = container.querySelector('[tabindex="0"]') as HTMLElement;
    scrollTo(viewport, 200);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    const dots = screen.getByRole("group", { name: "Choose a slide" });
    expect(
      within(dots).getByRole("button", { name: "Slide 3 of 3" }).getAttribute("aria-current"),
    ).toBe("true");
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(next.hasAttribute("disabled") || next.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
    press(screen.getByRole("button", { name: "Previous slide" }));
    scrollTo(viewport, -100);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    scrollTo(viewport, -100);
    expect(onIndexChange).toHaveBeenCalledTimes(2);
  });

  it("ignores a scroll before layout and can hide its arrows and dots", () => {
    const onIndexChange = vi.fn();
    const { container, rerender } = render(
      <Carousel label="Offers" showArrows={false} onIndexChange={onIndexChange}>
        {SLIDES}
      </Carousel>,
    );
    fireEvent.scroll(container.querySelector('[tabindex="0"]') as HTMLElement);
    expect(onIndexChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
    rerender(
      <Carousel label="Offers" showArrows={false} showDots={false}>
        {SLIDES}
      </Carousel>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <Carousel label="Offers" showDots={false}>
        {SLIDES}
      </Carousel>,
    );
    expect(screen.queryByRole("group", { name: "Choose a slide" })).toBeNull();
    expect(screen.getByRole("button", { name: "Next slide" })).toBeTruthy();
  });
});
