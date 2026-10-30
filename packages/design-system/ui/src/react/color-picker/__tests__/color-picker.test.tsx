/**
 * Stackra file contract:
 * Purpose: proves the web ColorPicker: a group named by its label (or an English default) with an area, a hue slider,
 *          swatches and a hex field; a swatch, a valid hex and a hue step each report the colour in lowercase hex; a
 *          half-typed hex is kept without a report; a controlled value is followed; and every part is disabled with it.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles and attributes are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ColorPicker } from "#react/color-picker/color-picker";

const SWATCHES = ["#ff0000", "#00ff00"] as const;
const hex = () => screen.getByRole("textbox", { name: "Hex code" }) as HTMLInputElement;

describe("ColorPicker (web)", () => {
  it("is a group named by its label that starts on the first swatch and picks another", () => {
    const onChange = vi.fn();
    render(
      <ColorPicker
        label="Brand"
        description="Used on buttons"
        swatches={SWATCHES}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("group", { name: "Brand" })).toBeTruthy();
    expect(screen.getByText("Used on buttons")).toBeTruthy();
    expect(hex().value).toBe("#ff0000");
    fireEvent.click(screen.getByRole("radio", { name: "#00ff00" }));
    expect(onChange).toHaveBeenLastCalledWith("#00ff00");
    expect(hex().value).toBe("#00ff00");
  });

  it("takes a typed hex once it is whole and keeps a half-typed one", () => {
    const onChange = vi.fn();
    render(<ColorPicker swatches={SWATCHES} defaultValue="#000000" onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Colour" })).toBeTruthy();
    fireEvent.change(hex(), { target: { value: "#12" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(hex().value).toBe("#12");
    fireEvent.change(hex(), { target: { value: "#123456" } });
    expect(onChange).toHaveBeenLastCalledWith("#123456");
  });

  it("steps the hue from the keyboard and follows a controlled value", () => {
    const onChange = vi.fn();
    render(<ColorPicker swatches={SWATCHES} value="#ff0000" onChange={onChange} />);
    const hue = screen.getByRole("slider", { name: /Hue/ });
    act(() => hue.focus());
    fireEvent.keyDown(hue, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.lastCall?.[0]).toMatch(/^#[0-9a-f]{6}$/);
    expect(hex().value).toBe("#ff0000");
  });

  it("disables every part with it", () => {
    render(<ColorPicker swatches={SWATCHES} isDisabled />);
    expect(hex().disabled).toBe(true);
    expect((screen.getByRole("radio", { name: "#00ff00" }) as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
