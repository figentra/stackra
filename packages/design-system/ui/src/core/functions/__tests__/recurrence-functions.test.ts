/**
 * Stackra file contract:
 * Purpose: proves the recurrence functions: `rruleOf` writes RFC 5545 text (RSCALE first, INTERVAL only above 1, the
 *          nth prefix on monthly BYDAY, COUNT before UNTIL); `parseRrule` reads it back, refuses bad text and drops
 *          parts it has no control for; `recurrenceAnchorOf` reads the weekday, nth and Hijri day off a first day;
 *          `recurrenceWithFrequency` keeps the end; `recurrenceWeekdaysFor` starts the week where the locale does; and
 *          `recurrenceSummaryOf` says the rule in English and Arabic.
 * Boundary: pure functions; Node's full ICU; the English and Arabic ui catalogues.
 * Runtime: node
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0022; STA-1371.
 */
import { CalendarDate } from "@internationalized/date";
import { formatMessage } from "@stackra/i18n";

import ar from "../../../../assets/lang/ar/ui.json";
import en from "../../../../assets/lang/en/ui.json";
import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { recurrenceAnchorOf } from "#core/functions/recurrence-anchor-of.function";
import { recurrenceSummaryOf } from "#core/functions/recurrence-summary-of.function";
import { recurrenceWeekdaysFor } from "#core/functions/recurrence-weekdays-for.function";
import { recurrenceWithFrequency } from "#core/functions/recurrence-with-frequency.function";
import { rruleOf } from "#core/functions/rrule-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";

const tEn: CatalogueText = (key, values) => formatMessage({ ui: en }, key, values, "en");
const tAr: CatalogueText = (key, values) => formatMessage({ ui: ar }, key, values, "ar");

describe("rruleOf and parseRrule", () => {
  it("writes RFC 5545 text and reads it back", () => {
    const rules: RecurrenceRule[] = [
      { frequency: "daily" },
      { frequency: "weekly", interval: 2, weekdays: ["SU", "WE"], count: 10 },
      { frequency: "monthly", weekdays: ["FR"], nth: -1, until: "2026-12-31" },
      { frequency: "monthly", monthDay: 1, calendar: "islamic-umalqura" },
      { frequency: "yearly", month: 9, monthDay: 1, calendar: "islamic-umalqura" },
    ];
    expect(rules.map(rruleOf)).toEqual([
      "FREQ=DAILY",
      "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE;COUNT=10",
      "FREQ=MONTHLY;BYDAY=-1FR;UNTIL=20261231",
      "RSCALE=ISLAMIC-UMALQURA;FREQ=MONTHLY;BYMONTHDAY=1",
      "RSCALE=ISLAMIC-UMALQURA;FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=1",
    ]);
    for (const rule of rules) expect(parseRrule(rruleOf(rule))).toEqual(rule);
  });

  it("reads the prefix, lower case, a time on UNTIL and an INTERVAL of 1", () => {
    expect(parseRrule("RRULE:freq=weekly;interval=1;byday=mo;until=20270101T000000Z")).toEqual({
      frequency: "weekly",
      interval: 1,
      weekdays: ["MO"],
      until: "2027-01-01",
    });
  });

  it("refuses text it cannot show and drops parts it has no control for", () => {
    for (const bad of [
      "",
      "FREQ=HOURLY",
      "FREQ=WEEKLY;BYDAY=XX",
      "FREQ=MONTHLY;BYMONTHDAY=40",
      "FREQ=DAILY;INTERVAL=0",
      "FREQ=DAILY;UNTIL=soon",
      "RSCALE=HEBREW;FREQ=MONTHLY",
      "FREQ=MONTHLY;BYDAY=0MO",
    ])
      expect(parseRrule(bad)).toBeUndefined();
    expect(parseRrule("FREQ=DAILY;BYHOUR=9;WKST=SU")).toEqual({ frequency: "daily" });
  });
});

describe("recurrenceAnchorOf", () => {
  it("reads the weekday, the nth weekday and the month off the first day", () => {
    // 2026-10-13 is the second Tuesday of October.
    expect(recurrenceAnchorOf(new CalendarDate(2026, 10, 13))).toEqual({
      weekday: "TU",
      monthDay: 13,
      nth: 2,
      month: 10,
    });
    expect(recurrenceAnchorOf(new CalendarDate(2026, 10, 30)).nth).toBe(-1);
  });

  it("counts the day of the month in the Hijri calendar when asked", () => {
    // 2026-02-18 is 1 Ramadan 1447 in Umm al-Qura.
    const anchor = recurrenceAnchorOf(new CalendarDate(2026, 2, 18), "islamic-umalqura");
    expect([anchor.monthDay, anchor.month]).toEqual([1, 9]);
  });
});

describe("recurrenceWithFrequency", () => {
  const anchor = { weekday: "TU", monthDay: 13, nth: 2, month: 10 } as const;
  it("keeps the interval and end and takes the rest from the first day", () => {
    const weekly: RecurrenceRule = { frequency: "weekly", interval: 2, weekdays: ["MO"], count: 5 };
    expect(recurrenceWithFrequency(weekly, "monthly", anchor)).toEqual({
      frequency: "monthly",
      interval: 2,
      count: 5,
      monthDay: 13,
    });
    expect(recurrenceWithFrequency(weekly, "weekly", anchor).weekdays).toEqual(["MO"]);
    expect(recurrenceWithFrequency({ frequency: "daily" }, "weekly", anchor).weekdays).toEqual([
      "TU",
    ]);
    expect(recurrenceWithFrequency({ frequency: "daily" }, "yearly", anchor)).toEqual({
      frequency: "yearly",
      month: 10,
      monthDay: 13,
    });
  });
});

describe("recurrenceWeekdaysFor", () => {
  it("starts the week on the locale's first day", () => {
    expect(recurrenceWeekdaysFor("ar-SA")[0]).toBe("SU");
    expect(recurrenceWeekdaysFor("en-GB")[0]).toBe("MO");
  });
});

describe("recurrenceSummaryOf", () => {
  it("says the rule in English", () => {
    expect(
      recurrenceSummaryOf(
        { frequency: "weekly", interval: 2, weekdays: ["SU", "WE"], count: 10 },
        tEn,
        "en",
      ),
    ).toBe("Every 2 weeks on Sunday and Wednesday, 10 times");
    expect(
      recurrenceSummaryOf({ frequency: "monthly", weekdays: ["FR"], nth: -1 }, tEn, "en"),
    ).toBe("Every month on the last Friday");
    expect(recurrenceSummaryOf({ frequency: "monthly", monthDay: -1 }, tEn, "en")).toBe(
      "Every month on the last day",
    );
    expect(recurrenceSummaryOf({ frequency: "daily", until: "2026-12-31" }, tEn, "en-GB")).toBe(
      "Every day, until 31 December 2026",
    );
  });

  it("says a Hijri rule with Hijri month names, and in Arabic", () => {
    const ramadan: RecurrenceRule = {
      frequency: "yearly",
      month: 9,
      monthDay: 1,
      calendar: "islamic-umalqura",
    };
    expect(recurrenceSummaryOf(ramadan, tEn, "en")).toBe(
      "Every year on Ramadan 1, in the Hijri calendar",
    );
    expect(recurrenceSummaryOf(ramadan, tAr, "ar", "latn")).toBe(
      "كل سنة في 1 رمضان، بالتقويم الهجري",
    );
    expect(
      recurrenceSummaryOf({ frequency: "daily", interval: 2, count: 3 }, tAr, "ar", "latn"),
    ).toBe("كل يومين، 3 مرات");
  });
});
