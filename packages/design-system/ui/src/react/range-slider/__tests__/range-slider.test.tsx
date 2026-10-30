/**
 * Stackra file contract:
 * Purpose: proves the web RangeSlider: two thumbs named by the label, a pair reported as each thumb moves from the
 *          keyboard, the fill drawn between the thumbs, a controlled pair, a fallback name without a text label, the
 *          description, and disabled thumbs.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { RangeSlider } from "#react/range-slider/range-slider";

const thumbs = () => screen.getAllByRole("slider") as HTMLInputElement[];

describe("RangeSlider (web)", () => {
  it("moves each thumb from the keyboard, reports the pair and draws the fill between them", () => {
    const onChange = vi.fn();
    const { container } = render(
      <RangeSlider
        label="Price"
        description="In SAR"
        defaultValue={[20, 60]}
        step={10}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("In SAR")).toBeTruthy();
    const [low, high] = thumbs();
    act(() => low?.focus());
    fireEvent.keyDown(low as HTMLElement, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith([30, 60]);
    act(() => high?.focus());
    fireEvent.keyDown(high as HTMLElement, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith([30, 50]);
    const fill = container.querySelector<HTMLElement>('[data-slot="slider-fill"]');
    expect(fill?.style.width).toBe("20%");
  });

  it("follows a controlled pair and starts at the bounds by default", () => {
    const onChange = vi.fn();
    const { unmount } = render(<RangeSlider label="Price" value={[10, 90]} onChange={onChange} />);
    fireEvent.keyDown(thumbs()[0] as HTMLElement, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith([11, 90]);
    expect(thumbs()[0]?.value).toBe("10");
    unmount();
    render(<RangeSlider label="Price" minValue={5} maxValue={50} />);
    expect(thumbs().map((thumb) => thumb.value)).toEqual(["5", "50"]);
  });

  it("is named without a text label and refuses input while disabled", () => {
    render(<RangeSlider isDisabled />);
    expect(screen.getByRole("group", { name: "range" })).toBeTruthy();
    expect(thumbs().every((thumb) => thumb.disabled)).toBe(true);
  });
});
