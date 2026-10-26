/**
 * Stackra file contract:
 * Purpose: proves `filterChipTextOf` writes each kind's value as a short phrase: text trimmed, the label of a chosen
 *          option (or its key when the option is gone), one to two labels of several and a count after that, a number
 *          range in the filter's format with one-sided bounds, a day range with one-sided phrases, the boolean's own
 *          words or Yes and No; and gives an empty string for a filter with no value or one that filters nothing.
 *          It also proves the list falls back to commas where `Intl.ListFormat` is missing, as on Hermes.
 * Boundary: pure unit test; Node's `Intl` data for `en` and `ar`.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-195 sta-350:FR-196
import { CalendarDate } from "@internationalized/date";

import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";

/** The words the filter bars pass, in English. */
const WORDS = { yes: "Yes", no: "No", from: "From", until: "Until" } as const;

const OPTIONS = [
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "refunded", label: "Refunded" },
] as const;

const TEXT: FilterDefinition = { id: "name", label: "Name", kind: "text" };
const SELECT: FilterDefinition = {
  id: "status",
  label: "Status",
  kind: "select",
  options: OPTIONS,
};
const MULTI: FilterDefinition = {
  id: "states",
  label: "States",
  kind: "multi-select",
  options: OPTIONS,
};
const NUMBER: FilterDefinition = {
  id: "total",
  label: "Total",
  kind: "number",
  formatOptions: { style: "currency", currency: "USD", maximumFractionDigits: 0 },
};
const DATES: FilterDefinition = { id: "placed", label: "Placed", kind: "date-range" };
const FLAG: FilterDefinition = { id: "gift", label: "Gift", kind: "boolean" };

describe("filterChipTextOf", () => {
  it("writes text trimmed", () => {
    expect(filterChipTextOf(TEXT, "  ada ", "en", WORDS)).toBe("ada");
  });

  it("writes the label of the chosen option, or its key when the option is gone", () => {
    expect(filterChipTextOf(SELECT, "paid", "en", WORDS)).toBe("Paid");
    expect(filterChipTextOf(SELECT, "lost", "en", WORDS)).toBe("lost");
  });

  it("names one or two chosen options and counts the rest", () => {
    expect(filterChipTextOf(MULTI, ["paid"], "en", WORDS)).toBe("Paid");
    expect(filterChipTextOf(MULTI, ["paid", "shipped"], "en", WORDS)).toBe("Paid, Shipped");
    expect(filterChipTextOf(MULTI, ["paid", "shipped", "refunded"], "en", WORDS)).toBe(
      "Paid, Shipped +1",
    );
  });

  // STA-486 item 1: Hermes has no Intl.ListFormat, and constructing it crashed every native FilterBar.
  it("joins the labels with commas where Intl.ListFormat is missing, as on Hermes", () => {
    const listFormat = Intl.ListFormat;
    Reflect.deleteProperty(Intl, "ListFormat");
    try {
      expect(typeof Intl.ListFormat).toBe("undefined");
      expect(filterChipTextOf(MULTI, ["paid"], "en", WORDS)).toBe("Paid");
      expect(filterChipTextOf(MULTI, ["paid", "shipped"], "en", WORDS)).toBe("Paid, Shipped");
      expect(filterChipTextOf(MULTI, ["paid", "shipped", "refunded"], "ar", WORDS)).toBe(
        "Paid, Shipped +1",
      );
    } finally {
      Object.defineProperty(Intl, "ListFormat", {
        value: listFormat,
        writable: true,
        configurable: true,
      });
    }
  });

  it("writes a number range in the filter's format, and a one-sided bound as at least or at most", () => {
    expect(filterChipTextOf(NUMBER, { min: 10, max: 99 }, "en", WORDS)).toBe("$10 – $99");
    expect(filterChipTextOf(NUMBER, { min: 10, max: null }, "en", WORDS)).toBe("≥ $10");
    expect(filterChipTextOf(NUMBER, { min: null, max: 99 }, "en", WORDS)).toBe("≤ $99");
    expect(filterChipTextOf(NUMBER, { min: 0, max: null }, "en", WORDS)).toBe("≥ $0");
  });

  it("writes a day range as that calendar day in the locale, never shifted by a time zone", () => {
    const start = new CalendarDate(2026, 3, 1);
    const end = new CalendarDate(2026, 3, 31);
    expect(filterChipTextOf(DATES, { start, end }, "en", WORDS)).toBe("Mar 1, 2026 – Mar 31, 2026");
    expect(filterChipTextOf(DATES, { start, end: null }, "en", WORDS)).toBe("From Mar 1, 2026");
    expect(filterChipTextOf(DATES, { start: null, end }, "en", WORDS)).toBe("Until Mar 31, 2026");
    expect(filterChipTextOf(DATES, { start, end }, "ar", WORDS)).not.toBe(
      filterChipTextOf(DATES, { start, end }, "en", WORDS),
    );
  });

  it("writes a yes or no in the filter's own words or the defaults", () => {
    expect(filterChipTextOf(FLAG, true, "en", WORDS)).toBe("Yes");
    expect(filterChipTextOf(FLAG, false, "en", WORDS)).toBe("No");
    const worded: FilterDefinition = { ...FLAG, trueLabel: "A gift", falseLabel: "Not a gift" };
    expect(filterChipTextOf(worded, true, "en", WORDS)).toBe("A gift");
    expect(filterChipTextOf(worded, false, "en", WORDS)).toBe("Not a gift");
  });

  it("gives an empty string for no value and for a value that filters nothing", () => {
    expect(filterChipTextOf(TEXT, undefined, "en", WORDS)).toBe("");
    expect(filterChipTextOf(TEXT, " ", "en", WORDS)).toBe("");
    expect(filterChipTextOf(MULTI, [], "en", WORDS)).toBe("");
    expect(filterChipTextOf(NUMBER, { min: null, max: null }, "en", WORDS)).toBe("");
    expect(filterChipTextOf(DATES, { start: null, end: null }, "en", WORDS)).toBe("");
  });

  it("gives an empty string for a value of the wrong shape rather than throwing", () => {
    expect(filterChipTextOf(NUMBER, "12", "en", WORDS)).toBe("");
    expect(filterChipTextOf(DATES, ["x"], "en", WORDS)).toBe("");
  });
});
