/**
 * Stackra file contract:
 * Purpose: unit tests of `formatMessage`: nested lookup by `<namespace>::<path>`, ICU arguments, the six Arabic plural
 *          categories, `select`, number arguments in the digits of the locale tag, rich-text tags kept literal, and
 *          clear failures for a malformed key or a missing message (never the raw key).
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0268 (R15: ICU messages); ADR 0192.
 */
import { describe, expect, it } from "@stackra/testing";

import { formatMessage } from "#core/functions/format-message.function";
import { keys } from "#core/functions/keys.function";

const I18n = keys({
  web: { nav: ["home"], cta: ["trial", "seats", "greeting", "bold"], inbox: ["unread"] },
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
