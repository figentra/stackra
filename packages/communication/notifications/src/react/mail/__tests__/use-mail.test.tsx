/**
 * Stackra file contract:
 * Purpose: unit tests of `useMail`: inside a mail render it returns the recipient's tools (locale, direction, `t`,
 *          `money`, `asset`), and outside one it throws instead of falling back to a default locale.
 * Boundary: test only; renders static markup with `react-dom/server`, no DOM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (class components: hook fields); ADR 0223.
 */
import { I18nConfig, keys, Locale } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { renderToStaticMarkup } from "react-dom/server";

import { renderMailBody } from "#react/mail/render-mail-body.function";
import { useMail } from "#react/mail/use-mail";

const I18n = keys({ orders: { order_receipt: { mail: ["intro"] } } });
const LOGO = {
  key: "orders::public/logo.svg",
  file: "assets/public/orders/logo.svg",
  overridable: true,
} as const;

/** A body that prints every tool. */
function ToolsMail() {
  const { t, money, asset, locale, dir } = useMail();
  return (
    <p>
      {[
        locale,
        dir,
        t(I18n.orders.order_receipt.mail.intro, { id: "ord_1" }),
        money(1250, "KWD"),
        asset(LOGO),
      ].join("|")}
    </p>
  );
}

describe("useMail", () => {
  it("returns the recipient's tools inside a mail render", () => {
    const { text } = renderMailBody(
      ToolsMail,
      {},
      {
        locale: Locale.En,
        messages: { orders: { order_receipt: { mail: { intro: "Thanks for order {id}" } } } },
        i18n: new I18nConfig(),
        asset: (entry) => `https://static.acme.example/${entry.file}`,
      },
    );
    expect(text).toBe(
      "en|ltr|Thanks for order ord_1|KWD 1.250|https://static.acme.example/assets/public/orders/logo.svg",
    );
  });

  it("throws outside a mail render", () => {
    expect(() => renderToStaticMarkup(<ToolsMail />)).toThrow(/mail render/);
  });
});
