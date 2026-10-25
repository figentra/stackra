/**
 * Stackra file contract:
 * Purpose: `alternates`, the hreflang alternates of one page: each shipped locale's absolute URL keyed by its BCP 47
 *          tag, plus `x-default` (the default locale's URL). The route adapters put them in every head and the
 *          sitemap route in every `<url>`, so links and sitemaps never disagree.
 * Boundary: an ordinary function over the route context, callable from client and server code (ADR 0301 decision
 *           6). The path may already carry a locale prefix; each URL is built by `localePath` on the site's
 *           canonical origin, never from the request's host.
 * Runtime: isomorphic
 * Governing contract: ADR 0301 (decisions 6 and 7); ADR 0297 (decision 4).
 */
import { I18nConfig } from "@stackra/i18n";

import { localePath } from "#core/functions/locale-path.function";
import type { AlternatesContext } from "#core/types/alternates-context.type";

/**
 * hreflang to absolute URL for `path`, `x-default` included.
 *
 * @example
 * alternates(ctx, "/pricing");
 * // { en: "https://acme.test/pricing", "ar-SA": "https://acme.test/ar-sa/pricing", "x-default": "https://acme.test/pricing" }
 */
export function alternates(
  ctx: AlternatesContext,
  path: string,
): Readonly<Record<string, string>> & { readonly "x-default": string } {
  const i18n = ctx.config(I18nConfig);
  const origin = ctx.site.origin.replace(/\/+$/, "");
  const urls: Record<string, string> = {};
  for (const locale of i18n.locales) urls[locale] = `${origin}${localePath(path, locale, i18n)}`;
  return { ...urls, "x-default": `${origin}${localePath(path, i18n.defaultLocale, i18n)}` };
}
