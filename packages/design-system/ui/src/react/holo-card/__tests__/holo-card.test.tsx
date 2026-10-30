/**
 * Stackra file contract:
 * Purpose: proves the web HoloCard: a pointer move tilts the card and moves the shine by setting its CSS variables,
 *          leaving resets them, a card with no size ignores the move, and a still card draws no shine layers and
 *          follows no pointer.
 * Boundary: jsdom has no layout, so `getBoundingClientRect` is stubbed on the card.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";

import { HoloCard } from "#react/holo-card/holo-card";

const box = (element: Element, width: number) =>
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width,
    height: 100,
    right: width,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

describe("HoloCard (web)", () => {
  it("tilts toward the pointer and resets when it leaves", () => {
    const { container } = render(<HoloCard maxTilt={10}>Card</HoloCard>);
    const card = container.querySelector('[data-slot="holo-card"]') as HTMLElement;
    expect(card.querySelectorAll("span[aria-hidden]")).toHaveLength(2);
    box(card, 200);
    fireEvent.pointerMove(card, { clientX: 200, clientY: 0 });
    expect(card.style.getPropertyValue("--holo-x")).toBe("100%");
    expect(card.style.getPropertyValue("--holo-rx")).toBe("10deg");
    expect(card.style.getPropertyValue("--holo-ry")).toBe("10deg");
    expect(card.style.getPropertyValue("--holo-on")).toBe("1");
    fireEvent.pointerLeave(card);
    expect(card.style.getPropertyValue("--holo-x")).toBe("50%");
    expect(card.style.getPropertyValue("--holo-on")).toBe("0");
  });

  it("ignores a move before layout", () => {
    const { container } = render(<HoloCard>Card</HoloCard>);
    const card = container.querySelector('[data-slot="holo-card"]') as HTMLElement;
    box(card, 0);
    fireEvent.pointerMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue("--holo-on")).toBe("");
  });

  it("stays still when asked", () => {
    const { container } = render(<HoloCard isStill>Card</HoloCard>);
    const card = container.querySelector('[data-slot="holo-card"]') as HTMLElement;
    expect(card.querySelectorAll("span[aria-hidden]")).toHaveLength(0);
    box(card, 200);
    fireEvent.pointerMove(card, { clientX: 10, clientY: 10 });
    expect(card.style.getPropertyValue("--holo-on")).toBe("");
  });
});
