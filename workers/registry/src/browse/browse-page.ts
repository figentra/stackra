/**
 * Stackra file contract:
 * Purpose: `browsePage`: one HTML page of the registry browser (the package list, a package, their 404) in the
 *          registry's shell: the progress bar, the wordmark, the search box, the language switch, the content and the
 *          footer, in English (`ltr`) or Arabic (`rtl`).
 * Boundary: builds a Response only. The page is self-contained: inline CSS, SVG and script, no external request; its
 *           CSP allows only that style, that script (by hash), same-origin fetches and a GET form back to this host.
 *           Callers escape what they pass as HTML.
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0297 (decision 4: no Vary, the URL selects the locale); the stackra theme.
 */
import { escapeHtml } from "#src/browse/escape-html";
import { localePath } from "#src/browse/locale-path";
import { toBase64 } from "#src/bytes/to-base64";
import { BROWSE_MESSAGES } from "#src/constants/browse-messages.constant";
import { BROWSE_SCRIPT } from "#src/constants/browse-script.constant";
import { BROWSE_STYLE } from "#src/constants/browse-style.constant";
import { STACKRA_WORDMARK_SVG } from "#src/constants/stackra-wordmark-svg.constant";
import type { BrowseLocale } from "#src/interfaces/browse-locale.type";

/** Where people who want more than the registry should go. */
const DOCS_URL = "https://docs.stackra.figentra.com";

/** The script's CSP hash, computed once per isolate. */
let scriptHash: Promise<string> | null = null;

const hashScript = async (): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(BROWSE_SCRIPT));
  return `'sha256-${toBase64(new Uint8Array(digest))}'`;
};

/** What a page shows. */
interface BrowsePageInput {
  readonly locale: BrowseLocale;
  /** Plain text; escaped here. */
  readonly title: string;
  /** HTML the caller built from escaped values. */
  readonly body: string;
  /** The search box's current text. */
  readonly query: string;
  /** This page's path without a locale prefix, for the language switch. */
  readonly path: string;
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * One page of the registry browser.
 *
 * @example
 * await browsePage({ locale: "en", title: "Stackra registry", body: "<h1>…</h1>", query: "", path: "/", status: 200, headers: {} });
 */
export async function browsePage(input: BrowsePageInput): Promise<Response> {
  const { locale } = input;
  const text = BROWSE_MESSAGES[locale];
  const other: BrowseLocale = locale === "en" ? "ar" : "en";
  const home = localePath(locale, "/");
  const hash = await (scriptHash ??= hashScript());
  const page = `<!doctype html>
<html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="view-transition" content="same-origin">
<title>${escapeHtml(input.title)}</title>
<link rel="alternate" hreflang="${other}" href="${escapeHtml(localePath(other, input.path))}">
<style>${BROWSE_STYLE}</style>
<script>${BROWSE_SCRIPT}</script>
</head>
<body>
<div id="progress" class="progress" role="presentation"></div>
<a class="skip" href="#main">${escapeHtml(text.skip)}</a>
<header>
<a class="brand" href="${home}" aria-label="${escapeHtml(text.title)}">${STACKRA_WORDMARK_SVG}<span>registry</span></a>
<form action="${home}" method="get" role="search">
<input type="search" name="q" value="${escapeHtml(input.query)}" placeholder="${escapeHtml(text.search)}" aria-label="${escapeHtml(text.search)}" autocomplete="off" spellcheck="false">
</form>
<nav>
<a href="${escapeHtml(localePath(other, input.path))}" hreflang="${other}" lang="${other}">${escapeHtml(text.switchLanguage)}</a>
<a href="${DOCS_URL}">${escapeHtml(text.docs)}</a>
</nav>
</header>
<main id="main">
${input.body}
</main>
<footer><div><span>© Figentra Technologies L.L.C</span><span dir="ltr">npm.stackra.figentra.com</span></div></footer>
</body>
</html>
`;
  return new Response(page, {
    status: input.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; script-src ${hash}; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`,
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      ...input.headers,
    },
  });
}
