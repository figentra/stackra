/**
 * Stackra file contract:
 * Purpose: proves the web AngleSlider is a named `slider` that speaks its angle in degrees, steps and wraps with the
 *          arrow keys (Shift fifteen steps, Home 0), turns to the angle of a press on the dial, and refuses changes
 *          when disabled.
 * Boundary: jsdom; the dial's box is stubbed so a press has a position.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { AngleSlider } from "#react/angle-slider/angle-slider";

describe("AngleSlider (web)", () => {
  it("is a named slider that speaks degrees and steps with the keys", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Gradient angle" defaultValue={45} onChange={onChange} />);
    const slider = screen.getByRole("slider", { name: "Gradient angle" });
    expect(slider.getAttribute("aria-valuetext")).toBe("45 degrees");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(46);
    fireEvent.keyDown(slider, { key: "ArrowLeft", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith(31);
    fireEvent.keyDown(slider, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith(359);
  });

  it("points at a press on the dial, snapped to the step", () => {
    const onChange = vi.fn();
    const { container } = render(<AngleSlider label="Rotation" step={15} onChange={onChange} />);
    const dial = container.querySelector<HTMLElement>("[data-slot=angle-slider-dial]");
    if (!dial) throw new Error("no dial");
    dial.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    dial.setPointerCapture = () => undefined;
    fireEvent.pointerDown(dial, { button: 0, clientX: 100, clientY: 52, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(90);
  });

  it("refuses changes when disabled", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Rotation" isDisabled onChange={onChange} />);
    const slider = screen.getByRole("slider");
    expect(slider.getAttribute("aria-disabled")).toBe("true");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
