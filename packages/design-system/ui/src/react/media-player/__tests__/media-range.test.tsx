/**
 * Stackra file contract:
 * Purpose: proves the MediaPlayer's `MediaRange`: a named horizontal slider with its value text; the arrows step,
 *          Page Up/Down step ten, Home and End go to the ends, all clamped to the range and kept from the player's own
 *          shortcuts; a primary press moves to the pointed place and a captured drag follows the pointer; the played
 *          and loaded fills are shares of the track, and an empty range draws nothing.
 * Boundary: the range alone, in jsdom; the track's box and pointer capture are stand-ins because jsdom has no layout.
 * Runtime: browser
 * Governing contract: WAI-ARIA APG slider; WCAG 2.2 SC 2.1.1 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { MediaRange } from "#react/media-player/media-range";

/** Renders a range and returns its slider and the change spy. */
function renderRange(value = 20, max = 100, buffered?: number) {
  const onChange = vi.fn();
  const onParentKey = vi.fn();
  render(
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: a stand-in for the player listening for bubbling shortcuts
    <div onKeyDown={onParentKey}>
      <MediaRange
        value={value}
        max={max}
        {...(buffered === undefined ? {} : { buffered })}
        label="Seek"
        valueText="0:20 of 1:40"
        step={5}
        onChange={onChange}
      />
    </div>,
  );
  return { slider: screen.getByRole("slider", { name: "Seek" }), onChange, onParentKey };
}

describe("MediaRange (web)", () => {
  it("is a named horizontal slider with its value text", () => {
    const { slider } = renderRange();
    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("100");
    expect(slider.getAttribute("aria-valuenow")).toBe("20");
    expect(slider.getAttribute("aria-valuetext")).toBe("0:20 of 1:40");
    expect(slider.getAttribute("aria-orientation")).toBe("horizontal");
    expect(slider.tabIndex).toBe(0);
  });

  it("steps from the keys, clamped to the range, without reaching the player", () => {
    const { slider, onChange, onParentKey } = renderRange();
    const cases: readonly [string, number][] = [
      ["ArrowRight", 25],
      ["ArrowUp", 25],
      ["ArrowLeft", 15],
      ["ArrowDown", 15],
      ["PageUp", 70],
      ["PageDown", 0],
      ["Home", 0],
      ["End", 100],
    ];
    for (const [key, expected] of cases) {
      onChange.mockClear();
      fireEvent.keyDown(slider, { key });
      expect(onChange).toHaveBeenLastCalledWith(expected);
    }
    expect(onParentKey).not.toHaveBeenCalled();
    onChange.mockClear();
    fireEvent.keyDown(slider, { key: "a" });
    expect(onChange).not.toHaveBeenCalled();
    expect(onParentKey).toHaveBeenCalledTimes(1);
  });

  it("moves to a pressed place and follows a captured drag", () => {
    const { slider, onChange } = renderRange();
    let captured = false;
    slider.getBoundingClientRect = () => ({ left: 100, width: 200 }) as DOMRect;
    slider.setPointerCapture = () => {
      captured = true;
    };
    slider.hasPointerCapture = () => captured;
    fireEvent.pointerMove(slider, { clientX: 150, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(slider, { button: 2, clientX: 150, pointerId: 1 });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(slider, { button: 0, clientX: 150, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(25);
    fireEvent.pointerMove(slider, { clientX: 400, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(100);
    fireEvent.pointerMove(slider, { clientX: 0, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("draws the played and loaded shares, and nothing for an empty range", () => {
    const { slider } = renderRange(25, 100, 60);
    const fills = [...slider.querySelectorAll<HTMLElement>("span > span")].map(
      (fill) => fill.style.width,
    );
    expect(fills).toEqual(["60%", "25%"]);
    const thumb = slider.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(thumb?.style.left).toBe("25%");
  });

  it("draws no fill when the length is not known yet", () => {
    const { slider } = renderRange(10, 0);
    const thumb = slider.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(thumb?.style.left).toBe("0%");
    expect(slider.querySelectorAll("span > span")).toHaveLength(1);
  });
});
