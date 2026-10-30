/**
 * Stackra file contract:
 * Purpose: proves `dateLabelOf` counts calendar days, not 24-hour spans; gives a due date overdue and due soon, an
 *          expiry expired and expiring soon, a plain date no state; picks the tone; writes a near date relative and a
 *          far one as a date; writes the full date in the Hijri calendar when asked; and refuses an invalid date.
 * Boundary: pure function; Node's full ICU.
 * Runtime: node
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { dateLabelOf } from "#core/functions/date-label-of.function";

const NOW = new Date(2026, 9, 28, 23, 30);
const base = {
  now: NOW,
  kind: "due",
  soonDays: 3,
  locale: "en",
  calendar: "gregory",
  isRelative: true,
} as const;
const at = (day: number, hour = 9) => new Date(2026, 9, day, hour);

describe("dateLabelOf", () => {
  it("counts calendar days, so early tomorrow is one day away late tonight", () => {
    expect(dateLabelOf({ ...base, date: at(29, 1) })?.days).toBe(1);
    expect(dateLabelOf({ ...base, date: at(27, 23) })?.days).toBe(-1);
    expect(dateLabelOf({ ...base, date: at(28, 0) })?.days).toBe(0);
  });

  it("gives a due date overdue once past, due soon within the window (today included), else none", () => {
    expect(dateLabelOf({ ...base, date: at(27) })).toMatchObject({
      state: "overdue",
      tone: "danger",
    });
    expect(dateLabelOf({ ...base, date: at(28) })).toMatchObject({
      state: "due_soon",
      tone: "warning",
    });
    expect(dateLabelOf({ ...base, date: at(31) })).toMatchObject({ state: "due_soon" });
    expect(dateLabelOf({ ...base, date: new Date(2026, 10, 1) })).toMatchObject({
      state: "none",
      tone: "default",
    });
    expect(dateLabelOf({ ...base, soonDays: 0, date: at(29) })?.state).toBe("none");
  });

  it("gives an expiry expired or expiring soon, and a plain date no state", () => {
    expect(dateLabelOf({ ...base, kind: "expiry", date: at(20) })).toMatchObject({
      state: "expired",
      tone: "danger",
    });
    expect(dateLabelOf({ ...base, kind: "expiry", date: at(29) })?.state).toBe("expiring_soon");
    expect(dateLabelOf({ ...base, kind: "date", date: at(20) })).toMatchObject({
      state: "none",
      tone: "default",
    });
  });

  it("writes a date within a week relative, and others, or with relative off, as the date", () => {
    expect(dateLabelOf({ ...base, date: at(29) })?.when).toBe("tomorrow");
    expect(dateLabelOf({ ...base, date: at(25) })?.when).toBe("3 days ago");
    expect(dateLabelOf({ ...base, locale: "ar", date: at(29) })?.when).toBe("غدًا");
    expect(dateLabelOf({ ...base, date: at(10) })?.when).toBe("Oct 10, 2026");
    expect(dateLabelOf({ ...base, isRelative: false, date: at(29) })?.when).toBe("Oct 29, 2026");
  });

  it("writes its texts in the digits asked for, or the tag's keyword, whatever the engine does with it", () => {
    expect(dateLabelOf({ ...base, date: at(25), numerals: "arab" })?.when).toBe("٣ days ago");
    expect(dateLabelOf({ ...base, locale: "en-u-nu-arab", date: at(10) })?.when).toBe(
      "Oct ١٠, ٢٠٢٦",
    );
    expect(
      dateLabelOf({ ...base, locale: "ar-u-nu-arab", date: at(10), numerals: "latn" })?.full,
    ).toMatch(/2026/);
  });

  it("writes the full date in the calendar asked for, and the ISO date", () => {
    const gregory = dateLabelOf({ ...base, date: at(29) });
    expect(gregory?.full).toBe("Thursday, October 29, 2026");
    expect(gregory?.iso).toBe(at(29).toISOString());
    const hijri = dateLabelOf({ ...base, calendar: "islamic-umalqura", date: at(29) });
    expect(hijri?.full).toMatch(/AH/);
    expect(hijri?.full).not.toMatch(/October/);
  });

  it("still writes Hijri where the engine refuses a hyphenated calendar option (Hermes on Android)", () => {
    const Real = Intl.DateTimeFormat;
    const Hermes = function (locale?: string, options?: Intl.DateTimeFormatOptions) {
      if (options?.calendar?.includes("-")) throw new RangeError("Invalid calendar option !");
      return new Real(locale, options);
    };
    vi.stubGlobal("Intl", { ...Intl, DateTimeFormat: Hermes });
    try {
      const hijri = dateLabelOf({ ...base, calendar: "islamic-umalqura", date: at(29) });
      expect(hijri?.full).toMatch(/AH/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("reads an ISO string, and refuses an invalid date", () => {
    expect(dateLabelOf({ ...base, date: at(27).toISOString() })?.state).toBe("overdue");
    expect(dateLabelOf({ ...base, date: "not a date" })).toBeUndefined();
  });
});
