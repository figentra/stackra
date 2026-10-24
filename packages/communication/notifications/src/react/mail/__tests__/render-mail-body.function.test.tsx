/**
 * Stackra file contract:
 * Purpose: unit tests of `renderMailBody`: an XHTML document with the body's markup and its text part, the ICU plural
 *          per locale (English `one`, Arabic dual and `few`), right-to-left for Arabic, the configured digits, and a
 *          RangeError for a key the catalogues lack.
 * Boundary: test only; the body is the compiled form of the template's receipt mail (a function component).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223; ADR 0192 (plurals and digits); ADR 0080.
 */
import { I18nConfig, keys, Locale, NumberingSystem } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { useMail } from "#react/mail/use-mail";
import { renderMailBody } from "#react/mail/render-mail-body.function";

const I18n = keys({
  orders: { order: ["lines_count"], order_receipt: { mail: ["intro", "missing"] } },
});

const MESSAGES = {
  en: {
    orders: {
      order: { lines_count: "{count, plural, one {# item} other {# items}}" },
      order_receipt: { mail: { intro: "Thank you for order {id}." } },
    },
  },
  ar: {
    orders: {
      order: {
        lines_count:
          "{count, plural, zero {لا بنود} one {بند واحد} two {بندان} few {# بنود} many {# بندًا} other {# بند}}",
      },
      order_receipt: { mail: { intro: "شكرًا لطلبك {id}." } },
    },
  },
};

interface ReceiptData {
  readonly id: string;
  readonly lines: number;
  readonly totalMinor: number;
}

/** The receipt body as gen compiles it. */
function OrderReceiptMail({ id, lines, totalMinor }: ReceiptData) {
  const { t, money, locale, dir } = useMail();
  return (
    <html lang={locale} dir={dir}>
      <body>
        <p>{t(I18n.orders.order_receipt.mail.intro, { id })}</p>
        <p>
          {money(totalMinor, "SAR")} · {t(I18n.orders.order.lines_count, { count: lines })}
        </p>
      </body>
    </html>
  );
}

/** A body that translates a key no catalogue holds. */
function Broken() {
  const { t } = useMail();
  return <p>{t(I18n.orders.order_receipt.mail.missing)}</p>;
}

/** Renders the receipt in `locale` with the base i18n configuration. */
function receipt(locale: Locale, lines: number, i18n = new I18nConfig()) {
  const messages = locale === Locale.Ar ? MESSAGES.ar : MESSAGES.en;
  return renderMailBody(
    OrderReceiptMail,
    { id: "ord_1", lines, totalMinor: 1_200 },
    {
      locale,
      messages,
      i18n,
      asset: (entry) => entry.file,
    },
  );
}

describe("renderMailBody", () => {
  it("renders an XHTML document and its text part", () => {
    const out = receipt(Locale.En, 1);
    expect(out.html.startsWith("<!DOCTYPE html PUBLIC")).toBe(true);
    expect(out.html).toContain('<html lang="en" dir="ltr">');
    expect(out.text).toBe("Thank you for order ord_1.\n\nSAR 12.00 · 1 item");
  });

  it("uses the Arabic dual and few forms, right to left", () => {
    const two = receipt(Locale.Ar, 2);
    const three = receipt(Locale.Ar, 3);
    expect(two.text).toContain("بندان");
    expect(three.text).toContain("3 بنود");
    expect(three.html).toContain('dir="rtl"');
  });

  it("follows the configured digits", () => {
    class ArabicDigits extends I18nConfig {
      override numerals: NumberingSystem = NumberingSystem.Arab;
    }
    expect(receipt(Locale.Ar, 3, new ArabicDigits()).text).toContain("٣ بنود");
  });

  it("refuses a key the catalogues lack", () => {
    expect(() =>
      renderMailBody(
        Broken,
        {},
        {
          locale: Locale.En,
          messages: MESSAGES.en,
          i18n: new I18nConfig(),
          asset: (entry) => entry.file,
        },
      ),
    ).toThrow(RangeError);
  });
});
