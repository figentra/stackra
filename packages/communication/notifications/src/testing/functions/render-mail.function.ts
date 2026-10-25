/**
 * Stackra file contract:
 * Purpose: `renderMail(body, data, { locale })`, the test renderer of a `.mail.tsx` body: the same renderer the Notifier
 *          sends with, fed the member's own catalogues for `locale`, so a test asserts the translated HTML and text
 *          (`renderMail(OrderReceiptMail, data, { locale: "ar" })`).
 * Boundary: node only. Without `messages` it reads `assets/lang/<base>/*.json` and then the regional overlay
 *           `assets/lang/<locale>/*.json` under the working directory (the member root vitest runs in), merged per
 *           namespace; a missing overlay folder is skipped. Without `i18n` it uses the base `I18nConfig` defaults;
 *           without `asset` an asset's URL is its source path.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0080 (catalogue layout, regional overlays); ADR 0234; ADR 0223.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { I18nConfig, type Locale, mergeCatalogues } from "@stackra/i18n";

import type { MailBody } from "#react/mail/mail-body.type";
import type { MailRenderOptions } from "#react/mail/mail-render-options.type";
import { renderMailBody } from "#react/mail/render-mail-body.function";
import type { RenderedMail } from "#react/mail/rendered-mail.type";
import type { RenderMailOptions } from "#testing/types/render-mail-options.type";

/** One parsed lang file. */
type Catalogue = Parameters<typeof mergeCatalogues>[0][number];

/** The member's catalogues of `locale`, base language first, merged per namespace. */
async function readMessages(locale: Locale): Promise<MailRenderOptions["messages"]> {
  const base = locale.split("-")[0] ?? locale;
  const byNamespace = new Map<string, Catalogue[]>();
  for (const tag of base === locale ? [locale] : [base, locale]) {
    const folder = join(process.cwd(), "assets", "lang", tag);
    let files: string[];
    try {
      files = await readdir(folder);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; // an overlay may ship no file
      throw error;
    }
    for (const file of files.filter((name) => name.endsWith(".json")).sort()) {
      const namespace = file.slice(0, -".json".length);
      const catalogue = JSON.parse(await readFile(join(folder, file), "utf8")) as Catalogue;
      byNamespace.set(namespace, [...(byNamespace.get(namespace) ?? []), catalogue]);
    }
  }
  return Object.fromEntries(
    [...byNamespace].map(([namespace, catalogues]) => [namespace, mergeCatalogues(catalogues)]),
  );
}

/**
 * The mail `body` rendered with `data` in `options.locale`.
 *
 * @throws RangeError when the body translates a key the catalogues lack.
 * @example
 * const out = await renderMail(OrderReceiptMail, await receipt(3), { locale: "ar" });
 * expect(out.text).toContain("3 بنود");
 * expect(out.html).toContain('dir="rtl"');
 */
export async function renderMail<P extends object>(
  body: MailBody<P>,
  data: P,
  options: RenderMailOptions,
): Promise<RenderedMail> {
  return renderMailBody(body, data, {
    locale: options.locale,
    messages: options.messages ?? (await readMessages(options.locale)),
    i18n: options.i18n ?? new I18nConfig(),
    asset: options.asset ?? ((entry) => entry.file),
  });
}
