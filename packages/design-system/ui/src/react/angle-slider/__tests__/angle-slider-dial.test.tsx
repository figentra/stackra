/**
 * Stackra file contract:
 * Purpose: proves the web AngleSlider's dial: a press moves the hand and hands focus to the thumb so the keys go on
 *          from there; a captured drag follows the pointer and a move without capture does nothing; a secondary
 *          button or a disabled dial ignores the press; the same angle is not reported twice; a controlled value only
 *          reports; the quarter ticks show only with `hasMarks`.
 * Boundary: jsdom; the dial's box and pointer capture are stand-ins because jsdom has no layout.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA APG slider; WCAG 2.2 SC 2.5.7; ADR 0022 (test placement);
 *          STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { AngleSlider } from "#react/angle-slider/angle-slider";
import type { AngleSliderProps } from "#react/angle-slider/angle-slider.props";

/** A slider whose dial is 100px square at the page's corner, with capture tracked. */
function renderDial(props: Partial<AngleSliderProps> = {}) {
  const onChange = vi.fn();
  const view = render(<AngleSlider label="Rotation" onChange={onChange} {...props} />);
  const dial = view.container.querySelector<HTMLElement>("[data-slot=angle-slider-dial]");
  if (!dial) throw new Error("no dial");
  let captured = false;
  dial.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  dial.setPointerCapture = () => {
    captured = true;
  };
  dial.hasPointerCapture = () => captured;
  return { ...view, dial, onChange, slider: screen.getByRole("slider", { name: "Rotation" }) };
}

describe("AngleSlider dial (web)", () => {
  it("moves the hand on a press and hands focus to the thumb", () => {
    const { dial, slider, onChange } = renderDial();
    fireEvent.pointerDown(dial, { button: 0, clientX: 50, clientY: 100, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(180);
    expect(slider.getAttribute("aria-valuetext")).toBe("180 degrees");
    expect(document.activeElement).toBe(slider);
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(181);
  });

  it("follows a captured drag, not a move before the press", () => {
    const { dial, onChange } = renderDial();
    fireEvent.pointerMove(dial, { clientX: 0, clientY: 50, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(dial, { button: 0, clientX: 100, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(dial, { clientX: 0, clientY: 50, pointerId: 1 });
    expect(onChange.mock.calls.map(([angle]) => angle)).toEqual([90, 270]);
    // The same place again reports nothing new.
    fireEvent.pointerMove(dial, { clientX: 0, clientY: 50, pointerId: 1 });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("ignores a secondary button and a disabled dial", () => {
    const secondary = renderDial();
    fireEvent.pointerDown(secondary.dial, { button: 2, clientX: 100, clientY: 50, pointerId: 1 });
    expect(secondary.onChange).not.toHaveBeenCalled();
    secondary.unmount();
    const disabled = renderDial({ isDisabled: true });
    fireEvent.pointerDown(disabled.dial, { button: 0, clientX: 100, clientY: 50, pointerId: 1 });
    expect(disabled.onChange).not.toHaveBeenCalled();
  });

  it("only reports under a controlled value", () => {
    const { dial, slider, onChange } = renderDial({ value: 30 });
    fireEvent.pointerDown(dial, { button: 0, clientX: 100, clientY: 50, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(90);
    expect(slider.getAttribute("aria-valuetext")).toBe("30 degrees");
  });

  it("draws the quarter ticks only with hasMarks", () => {
    const plain = renderDial();
    // The hand is the one line without ticks.
    expect(plain.dial.querySelectorAll("line")).toHaveLength(1);
    plain.unmount();
    const marked = renderDial({ hasMarks: true });
    expect(marked.dial.querySelectorAll("line")).toHaveLength(5);
  });
});
