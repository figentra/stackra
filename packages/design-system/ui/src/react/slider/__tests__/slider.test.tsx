/**
 * Stackra file contract:
 * Purpose: proves the web Slider exposes one named slider input with the value, steps with the keyboard, draws its
 *          marks hidden from screen readers with the value written when a mark has no label, fills from the reading
 *          start, and keeps a paired number input and the thumb in step both ways.
 * Boundary: jsdom with the real HeroUI and React Aria components.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Slider } from "#react/slider/slider";

describe("Slider (web)", () => {
  it("is one slider input named by its label, stepped by the arrow keys", () => {
    const changes: number[] = [];
    render(<Slider label="Volume" defaultValue={40} step={5} onChange={(v) => changes.push(v)} />);
    const input = screen.getByRole("slider", { name: "Volume" });
    expect((input as HTMLInputElement).value).toBe("40");
    fireEvent.keyDown(input, { key: "ArrowRight" });
    expect(changes.at(-1)).toBe(45);
  });

  it("draws the marks, hidden, writing the value when a mark has no label", () => {
    const { container } = render(
      <Slider
        label="Discount"
        marks={[{ value: 0 }, { value: 50, label: "Half" }, { value: 100 }]}
      />,
    );
    const marks = container.querySelector('[data-slot="slider-marks"]');
    expect(marks?.getAttribute("aria-hidden")).toBe("true");
    expect(marks?.textContent).toContain("Half");
    expect(marks?.textContent).toContain("100");
  });

  it("fills from the reading start with a logical inset", () => {
    const { container } = render(<Slider label="Level" defaultValue={25} />);
    const fill = container.querySelector<HTMLElement>('[data-slot="slider-fill"]');
    expect(fill?.style.insetInlineStart).toBe("0%");
    expect(fill?.style.width).toBe("25%");
  });

  it("keeps the paired input and the thumb in step", () => {
    const changes: number[] = [];
    render(<Slider label="Budget" hasInput defaultValue={10} onChange={(v) => changes.push(v)} />);
    const box = screen.getByRole("textbox", { name: "Budget" });
    fireEvent.change(box, { target: { value: "70" } });
    fireEvent.blur(box);
    expect(changes.at(-1)).toBe(70);
    expect((screen.getByRole("slider", { name: "Budget" }) as HTMLInputElement).value).toBe("70");
  });
});
