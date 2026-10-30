/**
 * Stackra file contract:
 * Purpose: proves `useTimeClockState()`: 12:00 by default on the hours face, the header text in both cycles, a step
 *          on each face (the minutes wrap within the hour: 12:00 back one 5-minute step is 12:55), a point on the face
 *          (the inner ring only on a 24-hour face), AM and PM, a controlled value, and no report of the same time.
 * Boundary: the hook through `renderHook` in jsdom with a plain number writer.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";

import { useTimeClockState } from "#react/hooks/use-time-clock-state";

/** Writes numbers with the given options in English. */
const format = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en", options).format(value);

describe("useTimeClockState", () => {
  it("starts at 12:00 on the hours face and writes the header in the cycle", () => {
    const twelve = renderHook(() => useTimeClockState({ hourCycle: 12 }, "en", format));
    expect(twelve.result.current).toMatchObject({
      view: "hours",
      time: { hour: 12, minute: 0 },
      hourText: "12",
      minuteText: "00",
      isPm: true,
    });
    const day = renderHook(() =>
      useTimeClockState({ hourCycle: 24, defaultValue: { hour: 0, minute: 5 } }, "en", format),
    );
    expect(day.result.current).toMatchObject({ hourText: "00", minuteText: "05", isPm: false });
    const midnight = renderHook(() =>
      useTimeClockState({ hourCycle: 12, defaultValue: { hour: 0, minute: 0 } }, "en", format),
    );
    expect(midnight.result.current.hourText).toBe("12");
  });

  it("follows the locale's cycle when none is given", () => {
    const { result } = renderHook(() => useTimeClockState({}, "en-GB", format));
    expect(result.current.cycle).toBe(24);
  });

  it("steps hours through the day and minutes within the hour", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimeClockState({ hourCycle: 24, minuteStep: 5, onChange }, "en", format),
    );
    act(() => result.current.step(-1));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 11, minute: 0 });
    act(() => result.current.setView("minutes"));
    act(() => result.current.step(-1));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 11, minute: 55 });
  });

  it("picks the point's hour, the inner ring only on a 24-hour face", () => {
    const onChange = vi.fn();
    const day = renderHook(() => useTimeClockState({ hourCycle: 24, onChange }, "en", format));
    // Straight right of the centre is 3 o'clock; near the centre it is the inner ring's 15.
    act(() => day.result.current.pointTo(60, 0, true));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 15, minute: 0 });
    act(() => day.result.current.pointTo(0, 80, false));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 6, minute: 0 });
    const twelve = renderHook(() =>
      useTimeClockState(
        { hourCycle: 12, defaultValue: { hour: 9, minute: 0 }, onChange },
        "en",
        format,
      ),
    );
    act(() => twelve.result.current.pointTo(60, 0, true));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 3, minute: 0 });
  });

  it("switches AM and PM and never reports the same time", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimeClockState(
        { hourCycle: 12, defaultValue: { hour: 9, minute: 30 }, onChange },
        "en",
        format,
      ),
    );
    act(() => result.current.setPeriod(false));
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.setPeriod(true));
    expect(onChange).toHaveBeenLastCalledWith({ hour: 21, minute: 30 });
    expect(result.current.time).toEqual({ hour: 21, minute: 30 });
  });

  it("shows a controlled value and only reports a change", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTimeClockState({ value: { hour: 8, minute: 0 }, onChange }, "en", format),
    );
    act(() => result.current.change({ hour: 9, minute: 0 }));
    expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 0 });
    expect(result.current.time).toEqual({ hour: 8, minute: 0 });
  });
});
