/**
 * Stackra file contract:
 * Purpose: proves the web WheelPicker reads as list boxes named by their columns and moves with the arrow keys, skipping refused rows, and that the WheelTimePicker hands back a time.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { WheelDatePicker } from "#react/wheel-picker/wheel-date-picker";
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

describe("WheelColumn (web)", () => {
  const LONG = [
    {
      id: "n",
      label: "Number",
      items: Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        label: String(i),
        isDisabled: i === 9,
      })),
    },
  ];

  it("jumps with Home, End, PageDown and PageUp, skipping a refused row, and ignores other keys", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={LONG} onChange={onChange} />);
    const wheel = screen.getByRole("listbox", { name: "Number" });
    fireEvent.keyDown(wheel, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith({ n: "8" });
    fireEvent.keyDown(wheel, { key: "PageUp" });
    expect(onChange).toHaveBeenLastCalledWith({ n: "4" });
    fireEvent.keyDown(wheel, { key: "PageDown" });
    expect(onChange).toHaveBeenLastCalledWith({ n: "8" });
    fireEvent.keyDown(wheel, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith({ n: "0" });
    const calls = onChange.mock.calls.length;
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.keyDown(wheel, { key: "a" });
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("picks a row by pointer, but not a refused one or the current one", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={LONG} onChange={onChange} />);
    fireEvent.click(screen.getByRole("option", { name: "9" }));
    fireEvent.click(screen.getByRole("option", { name: "0" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("option", { name: "3" }));
    expect(onChange).toHaveBeenLastCalledWith({ n: "3" });
  });

  it("settles on the row a scroll stops at, and snaps back while disabled", () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      const { rerender } = render(<WheelPicker columns={LONG} onChange={onChange} />);
      const wheel = screen.getByRole("listbox", { name: "Number" });
      wheel.scrollTo = vi.fn();
      wheel.scrollTop = 1000;
      fireEvent.scroll(wheel);
      act(() => vi.advanceTimersByTime(200));
      expect(onChange).toHaveBeenLastCalledWith({ n: "8" });
      rerender(<WheelPicker columns={LONG} onChange={onChange} isDisabled />);
      wheel.scrollTop = 0;
      fireEvent.scroll(wheel);
      fireEvent.scroll(wheel);
      act(() => vi.advanceTimersByTime(200));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(wheel.scrollTo).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("WheelDatePicker (web)", () => {
  it("wheels a day, a month and a year, clamping the day to the month", () => {
    const onChange = vi.fn();
    render(
      <WheelDatePicker
        defaultValue={new CalendarDate(2026, 1, 31)}
        minYear={2020}
        maxYear={2030}
        onChange={onChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("listbox", { name: "Month" }), { key: "ArrowDown" });
    expect(onChange.mock.lastCall?.[0].toString()).toBe("2026-02-28");
    fireEvent.keyDown(screen.getByRole("listbox", { name: "Year" }), { key: "ArrowDown" });
    expect(onChange.mock.lastCall?.[0].toString()).toBe("2027-02-28");
  });

  it("follows a controlled day", () => {
    const onChange = vi.fn();
    render(<WheelDatePicker value={new CalendarDate(2026, 3, 5)} onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("listbox", { name: "Day" }), { key: "ArrowDown" });
    expect(onChange.mock.lastCall?.[0].toString()).toBe("2026-03-06");
    expect(screen.getByRole("option", { name: "5" }).getAttribute("aria-selected")).toBe("true");
  });
});
