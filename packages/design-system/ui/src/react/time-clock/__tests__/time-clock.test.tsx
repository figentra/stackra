/**
 * Stackra file contract:
 * Purpose: proves the web TimeClock's face is a `slider` speaking the whole time, steps hours and stepped minutes
 *          with the keys, moves from the hours to the minutes on Enter and Tab and back on Shift+Tab, switches AM and
 *          PM, picks the hour of a press on the face and then shows the minutes, and draws the inner ring in 24 hours.
 * Boundary: jsdom; the face's box is stubbed so a press has a position. English, 12- or 24-hour as given.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TimeClock } from "#react/time-clock/time-clock";

describe("TimeClock (web)", () => {
  it("speaks the time and steps hours, then minutes on the step", () => {
    const onChange = vi.fn();
    render(
      <TimeClock
        label="Pickup"
        hourCycle={12}
        minuteStep={5}
        defaultValue={{ hour: 15, minute: 45 }}
        onChange={onChange}
      />,
    );
    const face = screen.getByRole("slider", { name: "Hour" });
    expect(face.getAttribute("aria-valuetext")).toMatch(/^3:45\sPM$/);
    fireEvent.keyDown(face, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 16, minute: 45 });
    fireEvent.keyDown(face, { key: "Enter" });
    const minutes = screen.getByRole("slider", { name: "Minute" });
    fireEvent.keyDown(minutes, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 16, minute: 50 });
    fireEvent.keyDown(minutes, { key: "PageDown" });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 16, minute: 35 });
    fireEvent.keyDown(minutes, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("slider", { name: "Hour" })).toBeTruthy();
  });

  it("switches AM and PM", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={12} defaultValue={{ hour: 9, minute: 0 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "PM" }));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 21, minute: 0 });
    expect(screen.getByRole("button", { name: "PM" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("picks the pressed hour and then shows the minutes", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={24} defaultValue={{ hour: 9, minute: 0 }} onChange={onChange} />);
    const face = screen.getByRole("slider", { name: "Hour" });
    face.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 }) as DOMRect;
    let captured = false;
    face.setPointerCapture = () => {
      captured = true;
    };
    face.hasPointerCapture = () => captured;
    face.releasePointerCapture = () => {
      captured = false;
    };
    // The inner ring, at 3 o'clock: 15.
    fireEvent.pointerDown(face, { button: 0, clientX: 152, clientY: 100, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 15, minute: 0 });
    fireEvent.pointerUp(face, { pointerId: 1 });
    expect(screen.getByRole("slider", { name: "Minute" })).toBeTruthy();
  });

  it("draws the inner ring in 24 hours and no AM or PM", () => {
    render(<TimeClock hourCycle={24} />);
    expect(screen.getByText("13")).toBeTruthy();
    expect(screen.getByText("23")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "AM" })).toBeNull();
  });
});
