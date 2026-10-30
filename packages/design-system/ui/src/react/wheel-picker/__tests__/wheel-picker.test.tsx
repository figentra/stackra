/**
 * Stackra file contract:
 * Purpose: proves the web WheelPicker reads as list boxes named by their columns and moves with the arrow keys, skipping refused rows, and that the WheelTimePicker hands back a time.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { WheelPicker } from "#react/wheel-picker/wheel-picker";
import { WheelTimePicker } from "#react/wheel-picker/wheel-time-picker";

const COLUMNS = [
  {
    id: "size",
    label: "Size",
    items: [
      { id: "s", label: "Small" },
      { id: "m", label: "Medium", isDisabled: true },
      { id: "l", label: "Large" },
    ],
  },
];

describe("WheelPicker (web)", () => {
  it("names each wheel and steps over a refused row", () => {
    const onChange = vi.fn();
    render(<WheelPicker label="Cup" columns={COLUMNS} onChange={onChange} />);
    expect(screen.getByRole("group", { name: "Cup" })).toBeTruthy();
    const wheel = screen.getByRole("listbox", { name: "Size" });
    expect(screen.getByRole("option", { name: "Small" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith({ size: "l" });
  });

  it("refuses change when disabled", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={COLUMNS} onChange={onChange} isDisabled />);
    fireEvent.keyDown(screen.getByRole("listbox", { name: "Size" }), { key: "End" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hands back a time from the hour wheel", () => {
    const onChange = vi.fn();
    render(
      <WheelTimePicker hourCycle={24} defaultValue={{ hour: 9, minute: 0 }} onChange={onChange} />,
    );
    fireEvent.keyDown(screen.getAllByRole("listbox")[0] as HTMLElement, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith({ hour: 10, minute: 0 });
  });
});
