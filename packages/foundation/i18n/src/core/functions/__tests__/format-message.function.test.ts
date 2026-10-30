/**
 * Stackra file contract:
 * Purpose: unit tests of `formatMessage`: nested lookup by `<namespace>::<path>`, ICU arguments, the six Arabic plural
 *          categories, `select`, numbers, dates and plurals in the digits of the tag or the argument (the latn/arab × en/ar matrix), rich-text tags kept literal, and
 *          clear failures for a malformed key or a missing message (never the raw key).
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0268 (R15: ICU messages); ADR 0192.
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { formatMessage } from "#core/functions/format-message.function";
import { intlLocale } from "#core/functions/intl-locale.function";
import { keys } from "#core/functions/keys.function";
import type { I18nKey } from "#core/types/i18n-key.type";

const I18n = keys({
  web: { nav: ["home"], cta: ["trial", "seats", "greeting", "bold", "weight"], inbox: ["unread"] },
  other: { title: ["x"] },
});

const PLURAL =
  "{count, plural, zero {لا رسائل} one {رسالة واحدة} two {رسالتان} few {# رسائل} many {# رسالة} other {# رسالة}}";

const MESSAGES = {
  web: {
    nav: { home: "Home" },
    cta: {
      trial: "Start your {days}-day trial",
      seats: "{count, plural, one {# seat} other {# seats}}",
      greeting: "{tone, select, formal {Good day} other {Hi}}, {name}",
      bold: "Read <b>this</b>",
      weight: "{kg, number} kg on {day, date, ::yyyyMMdd}",
    },
    inbox: { unread: PLURAL },
  },
};

/** The Arabic unread line for `count`, in Latin digits. */
const unread = (count: number) =>
  formatMessage(MESSAGES, I18n.web.inbox.unread, { count }, "ar-u-nu-latn");

describe("formatMessage", () => {
  it("finds a nested message by namespace and path", () => {
    expect(formatMessage(MESSAGES, I18n.web.nav.home, undefined, "en")).toBe("Home");
  });

  it("formats ICU arguments, plurals and selects", () => {
    expect(formatMessage(MESSAGES, I18n.web.cta.trial, { days: 14 }, "en")).toBe(
      "Start your 14-day trial",
    );
    expect(formatMessage(MESSAGES, I18n.web.cta.seats, { count: 1 }, "en")).toBe("1 seat");
    expect(formatMessage(MESSAGES, I18n.web.cta.seats, { count: 3 }, "en")).toBe("3 seats");
    expect(
      formatMessage(MESSAGES, I18n.web.cta.greeting, { tone: "formal", name: "Mona" }, "en"),
    ).toBe("Good day, Mona");
  });

  it("picks each of the six Arabic plural categories", () => {
    expect(unread(0)).toBe("لا رسائل");
    expect(unread(1)).toBe("رسالة واحدة");
    expect(unread(2)).toBe("رسالتان");
    expect(unread(3)).toBe("3 رسائل");
    expect(unread(11)).toBe("11 رسالة");
    expect(unread(100)).toBe("100 رسالة");
  });

  it("renders numbers in the digits the locale tag names", () => {
    expect(formatMessage(MESSAGES, I18n.web.cta.seats, { count: 3 }, "en-u-nu-arab")).toBe(
      "٣ seats",
    );
  });

  it.each([
    ["en", NumberingSystem.Latn, "1,310.5 kg on 10/28/2026", "3 seats"],
    ["ar", NumberingSystem.Latn, "1,310.5 kg on 28/10/2026", "3 رسائل"],
    ["en", NumberingSystem.Arab, "١٬٣١٠٫٥ kg on ١٠/٢٨/٢٠٢٦", "٣ seats"],
    ["ar", NumberingSystem.Arab, "١٬٣١٠٫٥ kg on ٢٨/١٠/٢٠٢٦", "٣ رسائل"],
  ] as const)(
    "writes %s numbers, dates and plurals in %s digits",
    (locale, numerals, weight, count) => {
      // Given as the tag's keyword (the provider) and as the argument with a bare tag (an engine ignoring the keyword).
      for (const [tag, given] of [
        [intlLocale(locale, numerals), undefined],
        [locale, numerals],
      ] as const) {
        const at = (key: I18nKey, values: Record<string, unknown>) =>
          formatMessage(MESSAGES, key, values, tag, given)
            .replaceAll(/[\u200e\u200f\u061c]/g, "")
            .replaceAll(/[\u00a0\u202f]/g, " ");
        expect(at(I18n.web.cta.weight, { kg: 1310.5, day: Date.UTC(2026, 9, 28) })).toBe(weight);
        expect(at(locale === "ar" ? I18n.web.inbox.unread : I18n.web.cta.seats, { count: 3 })).toBe(
          count,
        );
      }
    },
  );

  it("keeps rich-text tags as literal text", () => {
    expect(formatMessage(MESSAGES, I18n.web.cta.bold, undefined, "en")).toBe("Read <b>this</b>");
  });

  it("throws on a missing message instead of rendering the raw key", () => {
    expect(() => formatMessage(MESSAGES, I18n.other.title.x, undefined, "en")).toThrow(
      /No message for "other::title\.x" in locale en/,
    );
    expect(() =>
      formatMessage({ web: { nav: "flat" } }, I18n.web.nav.home, undefined, "en"),
    ).toThrow(/No message/);
  });

  it("throws on a key without a namespace", () => {
    expect(() =>
      formatMessage(MESSAGES, "nav.home" as typeof I18n.web.nav.home, undefined, "en"),
    ).toThrow(/not an i18n key/);
  });
});
