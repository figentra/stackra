/**
 * Stackra file contract:
 * Purpose: proves the web Rating is a named radio group of stars that picks, clears when `isClearable`, refuses when
 *          disabled, and read-only is one image naming the fraction with part of a star filled.
 * Boundary: jsdom with the real HeroUI and React Aria components; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { Rating } from "#react/rating/rating";

/** The third star's radio. */
const third = (): HTMLElement => screen.getByRole("radio", { name: "3 stars" });

describe("Rating (web)", () => {
  it("is a named group of star radios that picks a value", () => {
    const onChange = vi.fn();
    render(<Rating label="Service" onChange={onChange} />);
    expect(screen.getByRole("radiogroup", { name: "Service" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect((screen.getByRole("radio", { name: "4 stars" }) as HTMLInputElement).checked).toBe(true);
  });

  it("clears on a press of the chosen star only when clearable", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Rating defaultValue={3} onChange={onChange} />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeTruthy();
    fireEvent.click(third());
    expect(onChange).not.toHaveBeenCalled();
    rerender(<Rating defaultValue={3} isClearable onChange={onChange} />);
    fireEvent.click(third());
    expect(onChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(third());
    fireEvent.keyDown(third(), { key: "Delete" });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("is one image with a partly filled star when read-only", () => {
    const { container } = render(<Rating value={3.5} isReadOnly label="Al Olaya branch" />);
    expect(screen.getByRole("img", { name: "Al Olaya branch: 3.5 out of 5 stars" })).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
    const fills = [...container.querySelectorAll<HTMLElement>("[data-slot=rating-fill]")];
    expect(fills.map((fill) => fill.style.width)).toEqual(["100%", "100%", "100%", "50%"]);
  });

  it("refuses picks when disabled", () => {
    render(<Rating isDisabled />);
    expect((screen.getByRole("radio", { name: "1 star" }) as HTMLInputElement).disabled).toBe(true);
  });
});
