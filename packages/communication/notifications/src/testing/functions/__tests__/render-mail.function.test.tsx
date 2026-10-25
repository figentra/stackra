/**
 * Stackra file contract:
 * Purpose: unit tests of `renderMail`: with only a locale it reads the member's own lang files (the base language,
 *          then the regional overlay) from the working directory; it takes catalogues, an i18n configuration and an
 *          asset resolver when a test passes them; and the source path is an asset's default URL.
 * Boundary: test only; the lang files are written to a temporary member root that `process.cwd()` is pointed at.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3; vi from vitest); ADR 0080 (overlays).
 */
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { I18nConfig, keys, Locale } from "@stackra/i18n";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { useMail } from "#react/mail/use-mail";
import { renderMail } from "#testing/functions/render-mail.function";

const I18n = keys({ orders: { order_placed: { mail: ["body", "cta"] } } });
const LOGO = {
  key: "orders::public/logo.svg",
  file: "assets/public/orders/logo.svg",
  overridable: true,
} as const;

/** The order confirmation body as gen compiles it. */
function OrderPlacedMail({ url }: { readonly url: string }) {
  const { t, asset, locale, dir } = useMail();
  return (
    <html lang={locale} dir={dir}>
      <body>
        <img src={asset(LOGO)} alt="" />
        <p>{t(I18n.orders.order_placed.mail.body)}</p>
        <a href={url}>{t(I18n.orders.order_placed.mail.cta)}</a>
      </body>
    </html>
  );
}

let root = "";

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "notifications-render-mail-"));
  const write = async (locale: string, catalogue: object) => {
    await mkdir(join(root, "assets", "lang", locale), { recursive: true });
    await writeFile(join(root, "assets", "lang", locale, "orders.json"), JSON.stringify(catalogue));
  };
  await write("en", {
    order_placed: { mail: { body: "Your order is placed.", cta: "View your order" } },
  });
  await write("en-US", { order_placed: { mail: { cta: "View your order now" } } });
  await write("ar", { order_placed: { mail: { body: "تم استلام طلبك.", cta: "عرض الطلب" } } });
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

afterAll(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

describe("renderMail", () => {
  it("reads the member's lang files for the locale", async () => {
    const out = await renderMail(
      OrderPlacedMail,
      { url: "https://acme.example/orders/ord_1" },
      { locale: Locale.Ar },
    );
    expect(out.html).toContain('dir="rtl"');
    expect(out.html).toContain('src="assets/public/orders/logo.svg"');
    expect(out.text).toBe("تم استلام طلبك.\n\nعرض الطلب (https://acme.example/orders/ord_1)");
  });

  it("lays the regional overlay over its base language", async () => {
    const out = await renderMail(
      OrderPlacedMail,
      { url: "https://acme.example/o" },
      { locale: Locale.EnUs },
    );
    expect(out.text).toBe("Your order is placed.\n\nView your order now (https://acme.example/o)");
  });

  it("takes catalogues, an i18n configuration and an asset resolver from the test", async () => {
    const out = await renderMail(
      OrderPlacedMail,
      { url: "https://acme.example/o" },
      {
        locale: Locale.En,
        messages: { orders: { order_placed: { mail: { body: "Placed.", cta: "Open" } } } },
        i18n: new I18nConfig(),
        asset: (entry) => `https://static.acme.example/${entry.file}`,
      },
    );
    expect(out.html).toContain('src="https://static.acme.example/assets/public/orders/logo.svg"');
    expect(out.text).toBe("Placed.\n\nOpen (https://acme.example/o)");
  });
});
