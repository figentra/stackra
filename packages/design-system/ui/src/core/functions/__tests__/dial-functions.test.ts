/**
 * Stackra file contract:
 * Purpose: proves the dial helpers of the AngleSlider, TimeClock and MediaPlayer: `angleOfPoint` measures clockwise
 *          from the top, `snapAngle` rounds and wraps, `timeOfClockAngle` reads hours (12-hour, 24-hour outer and
 *          inner ring) and stepped minutes, `stepClockTime` wraps, `clockTimeTextOf` writes the locale's time in the
 *          customer's digits, `dayPeriodsOf` names AM and PM in the locale (falling back to them when the engine names
 *          none), and `mediaTimeOf` writes player times.
 * Boundary: pure functions.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { angleOfKey } from "#core/functions/angle-of-key.function";
import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { clockFaceOf } from "#core/functions/clock-face-of.function";
import { clockTimeTextOf } from "#core/functions/clock-time-text-of.function";
import { dayPeriodsOf } from "#core/functions/day-periods-of.function";
import { mediaTimeOf } from "#core/functions/media-time-of.function";
import { snapAngle } from "#core/functions/snap-angle.function";
import { stepClockTime } from "#core/functions/step-clock-time.function";
import { timeOfClockAngle } from "#core/functions/time-of-clock-angle.function";

describe("angleOfPoint", () => {
  it("measures clockwise from 12 o'clock", () => {
    expect(angleOfPoint(0, -10)).toBe(0);
    expect(angleOfPoint(10, 0)).toBe(90);
    expect(angleOfPoint(0, 10)).toBe(180);
    expect(angleOfPoint(-10, 0)).toBe(270);
    expect(angleOfPoint(10, -10)).toBeCloseTo(45);
  });
});

describe("snapAngle", () => {
  it("rounds to the step and wraps into one turn", () => {
    expect(snapAngle(47, 15)).toBe(45);
    expect(snapAngle(359.6, 1)).toBe(0);
    expect(snapAngle(-15, 1)).toBe(345);
    expect(snapAngle(725, 0)).toBe(5);
  });
});

describe("angleOfKey", () => {
  it("steps, wraps, jumps fifteen steps with Shift or Page keys, and ignores other keys", () => {
    expect(angleOfKey("ArrowRight", 350, 15, false)).toBe(0);
    expect(angleOfKey("ArrowLeft", 0, 1, false)).toBe(359);
    expect(angleOfKey("ArrowUp", 10, 1, true)).toBe(25);
    expect(angleOfKey("PageDown", 10, 1, false)).toBe(355);
    expect(angleOfKey("Home", 45, 1, false)).toBe(0);
    expect(angleOfKey("End", 45, 5, false)).toBe(355);
    expect(angleOfKey("a", 45, 1, false)).toBeUndefined();
  });
});

describe("timeOfClockAngle", () => {
  const morning = { hour: 9, minute: 30 };
  it("reads a 12-hour face, keeping the half of the day", () => {
    expect(timeOfClockAngle(90, { view: "hours", value: morning, hourCycle: 12 })).toEqual({
      hour: 3,
      minute: 30,
    });
    expect(
      timeOfClockAngle(2, { view: "hours", value: { hour: 14, minute: 0 }, hourCycle: 12 }),
    ).toEqual({
      hour: 12,
      minute: 0,
    });
    expect(timeOfClockAngle(0, { view: "hours", value: morning, hourCycle: 12 })).toEqual({
      hour: 0,
      minute: 30,
    });
  });
  it("reads the outer and inner rings of a 24-hour face", () => {
    expect(timeOfClockAngle(0, { view: "hours", value: morning, hourCycle: 24 }).hour).toBe(12);
    expect(
      timeOfClockAngle(0, { view: "hours", value: morning, hourCycle: 24, isInner: true }).hour,
    ).toBe(0);
    expect(
      timeOfClockAngle(90, { view: "hours", value: morning, hourCycle: 24, isInner: true }).hour,
    ).toBe(15);
  });
  it("reads minutes on the step", () => {
    expect(
      timeOfClockAngle(100, { view: "minutes", value: morning, hourCycle: 12, minuteStep: 5 }),
    ).toEqual({
      hour: 9,
      minute: 15,
    });
    expect(timeOfClockAngle(358, { view: "minutes", value: morning, hourCycle: 12 })).toEqual({
      hour: 9,
      minute: 0,
    });
  });
});

describe("stepClockTime", () => {
  it("wraps hours through the day and minutes within the hour", () => {
    expect(stepClockTime({ hour: 23, minute: 5 }, "hours", 1)).toEqual({ hour: 0, minute: 5 });
    expect(stepClockTime({ hour: 0, minute: 5 }, "hours", -1)).toEqual({ hour: 23, minute: 5 });
    expect(stepClockTime({ hour: 9, minute: 55 }, "minutes", 1, 5)).toEqual({ hour: 9, minute: 0 });
    expect(stepClockTime({ hour: 9, minute: 7 }, "minutes", -1, 5)).toEqual({ hour: 9, minute: 0 });
  });
});

describe("clockTimeTextOf", () => {
  it("writes the locale's time in the chosen digits", () => {
    expect(clockTimeTextOf({ hour: 15, minute: 45 }, "en-US", 12)).toMatch(/^3:45\sPM$/);
    expect(clockTimeTextOf({ hour: 15, minute: 5 }, "en-GB", 24)).toBe("15:05");
    expect(clockTimeTextOf({ hour: 15, minute: 45 }, "ar", 12, "latn")).toContain("3:45");
    expect(clockTimeTextOf({ hour: 15, minute: 45 }, "ar", 12, "arab")).toContain("٣:٤٥");
  });
});

/** An English number writer. */
const write = (n: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en", options).format(n);

describe("clockFaceOf", () => {
  it("draws 12 and 1 to 11 with the hand on the hour", () => {
    const face = clockFaceOf({ hour: 15, minute: 0 }, "hours", 12, write);
    expect(face.numerals.map((n) => n.text)).toEqual([
      "12",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
    ]);
    expect(face.numerals.find((n) => n.isSelected)?.text).toBe("3");
    expect(face.hand).toEqual({ angle: 90, isInner: false });
  });
  it("adds the inner ring in a 24-hour cycle", () => {
    const face = clockFaceOf({ hour: 0, minute: 0 }, "hours", 24, write);
    expect(face.numerals).toHaveLength(24);
    expect(face.numerals.find((n) => n.isSelected)).toMatchObject({ text: "00", isInner: true });
    expect(face.hand).toEqual({ angle: 0, isInner: true });
  });
  it("draws minutes by fives", () => {
    const face = clockFaceOf({ hour: 9, minute: 45 }, "minutes", 12, write);
    expect(face.numerals[0]?.text).toBe("00");
    expect(face.numerals.find((n) => n.isSelected)?.text).toBe("45");
    expect(face.hand.angle).toBe(270);
  });
});

describe("dayPeriodsOf", () => {
  it("names the two halves of the day in the locale", () => {
    expect(dayPeriodsOf("en-US")).toEqual(["AM", "PM"]);
    expect(dayPeriodsOf("ar")).toEqual(["ص", "م"]);
  });

  it("falls back to AM and PM when the engine names no day period", () => {
    const parts = vi
      .spyOn(Intl.DateTimeFormat.prototype, "formatToParts")
      .mockReturnValue([{ type: "hour", value: "9" }]);
    try {
      expect(dayPeriodsOf("en-US")).toEqual(["AM", "PM"]);
    } finally {
      parts.mockRestore();
    }
  });
});

describe("mediaTimeOf", () => {
  it("writes minutes and seconds, hours when there are any, and zero for an unknown length", () => {
    expect(mediaTimeOf(7.9, "latn")).toBe("0:07");
    expect(mediaTimeOf(750, "latn")).toBe("12:30");
    expect(mediaTimeOf(3723, "latn")).toBe("1:02:03");
    expect(mediaTimeOf(Number.NaN, "latn")).toBe("0:00");
    expect(mediaTimeOf(Number.POSITIVE_INFINITY, "latn")).toBe("0:00");
    expect(mediaTimeOf(65, "arab")).toBe("١:٠٥");
  });
});
