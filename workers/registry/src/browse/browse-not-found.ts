/**
 * Stackra file contract:
 * Purpose: `browseNotFound`: the registry browser's HTML 404, for an unknown package or one the request may not see.
 * Boundary: builds a Response only; private and uncached, so a hidden name answers the same with or without a token.
 * Runtime: worker
 * Governing contract: ADR 0453; STA-1608 spec.
 */
import { browsePage } from "#src/browse/browse-page";
import { escapeHtml } from "#src/browse/escape-html";
import { localePath } from "#src/browse/locale-path";
import { BROWSE_MESSAGES } from "#src/constants/browse-messages.constant";
import { PRIVATE_NO_STORE } from "#src/constants/private-no-store.constant";
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";

/**
 * The browser's HTML 404.
 *
 * @example
 * await browseNotFound("en", "/package/@stackra/unknown"); // 404 text/html
 */
export async function browseNotFound(locale: BrowseLocale, path: string): Promise<Response> {
  const text = BROWSE_MESSAGES[locale];
  return browsePage({
    locale,
    title: `${text.notFound} · ${text.title}`,
    body: `<h1 tabindex="-1">${escapeHtml(text.notFound)}</h1>
<p class="lead">${escapeHtml(text.notFoundBody)}</p>
<p><a href="${localePath(locale, "/")}">${escapeHtml(text.allPackages)}</a></p>`,
    query: "",
    path,
    status: 404,
    headers: { "cache-control": PRIVATE_NO_STORE, vary: "authorization" },
  });
}
