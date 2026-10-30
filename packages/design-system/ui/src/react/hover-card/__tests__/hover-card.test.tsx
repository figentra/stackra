/**
 * Stackra file contract:
 * Purpose: proves the web HoverCard: a mouse hover opens it after the open delay, leaving closes it after the close
 *          delay unless the pointer moves onto the card, focus opens it at once and blur closes it, Escape closes
 *          it, and a touch hover does nothing.
 * Boundary: jsdom with real HeroUI and React Aria, on fake timers; pointer events are dispatched by hand.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { HoverCard } from "#react/hover-card/hover-card";

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const card = () => screen.queryByRole("dialog", { name: "Profile" });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const setup = () => {
  render(
    <HoverCard
      label="Profile"
      trigger={<button type="button">Sara</button>}
      openDelay={300}
      closeDelay={100}
    >
      <p>Sara details</p>
    </HoverCard>,
  );
  return (screen.getByRole("button", { name: "Sara" }).closest("span.inline-flex") ??
    document.body) as HTMLElement;
};

describe("HoverCard (web)", () => {
  it("opens after the delay on mouse hover and closes after leaving", () => {
    const wrapper = setup();
    fireEvent.pointerEnter(wrapper, { pointerType: "mouse" });
    wait(200);
    expect(card()).toBeNull();
    wait(200);
    expect(card()).not.toBeNull();
    expect(screen.getByText("Sara details")).toBeTruthy();
    fireEvent.pointerLeave(wrapper, { pointerType: "mouse" });
    // Moving onto the card keeps it open.
    fireEvent.pointerEnter(screen.getByText("Sara details").parentElement as HTMLElement);
    wait(200);
    expect(card()).not.toBeNull();
    fireEvent.pointerLeave(screen.getByText("Sara details").parentElement as HTMLElement);
    wait(200);
    expect(card()).toBeNull();
  });

  it("ignores a touch hover", () => {
    const wrapper = setup();
    fireEvent.pointerEnter(wrapper, { pointerType: "touch" });
    fireEvent.pointerLeave(wrapper, { pointerType: "touch" });
    wait(1000);
    expect(card()).toBeNull();
  });

  it("opens on focus, closes on Escape and on blur", () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Sara" });
    fireEvent.focus(trigger);
    wait(0);
    expect(card()).not.toBeNull();
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(card()).not.toBeNull();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(card()).toBeNull();
    fireEvent.focus(trigger);
    wait(0);
    fireEvent.blur(trigger);
    wait(100);
    expect(card()).toBeNull();
  });
});
