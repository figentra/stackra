/**
 * Stackra file contract:
 * Purpose: `renderShellPage(page)`, the HTML of one shell page load, as the edge Worker writes it (ADR 0437 decision
 *          2.5): the shell's import map, the startup record as `#stackra-startup`, `modulepreload` links for the shell
 *          entry and the bundle, the bundle's stylesheets, the root element and the shell entry as a module script.
 * Boundary: pure; for the local edge (`previewServe`). shortcut: a copy of the OS edge Worker's `renderShellPage`
 *           (os workers/edge); keep the two in step until the Worker's renderer is a shared package. JSON is written
 *           with `<` escaped so no value can close its element; every attribute value is escaped.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 2.5 and 3); ADR 0436 (decision 7); STA-1676.
 */
import { PREVIEW_SERVE_SETTINGS } from "#node/constants/preview-serve-settings.constant";
import type { EdgeRelease } from "#node/types/edge-release.type";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";
import type { StartupRecord } from "#node/types/startup-record.type";

/** JSON for an inline `<script>`: `<` is escaped so the text cannot close the element. */
const inline = (value: unknown): string => JSON.stringify(value).replaceAll("<", "\\u003c");

/** `text` safe inside an attribute or element. */
const escape = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * The page's HTML; a local page is never indexed.
 *
 * @example
 * const html = renderShellPage({ shell, release, record, title: "acme" });
 */
export function renderShellPage(page: {
  readonly shell: EdgeShellRelease;
  readonly release: EdgeRelease;
  readonly record: StartupRecord;
  readonly title: string;
}): string {
  const { shell, release, record } = page;
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escape(page.title)}</title>`,
    '<meta name="robots" content="noindex">',
    `<script type="importmap">${inline(shell.importMap)}</script>`,
    `<script type="application/json" id="${PREVIEW_SERVE_SETTINGS.startupRecordId}">${inline(record)}</script>`,
    ...[...new Set([shell.entry, ...release.modulepreload])].map(
      (url) => `<link rel="modulepreload" crossorigin href="${escape(url)}">`,
    ),
    ...release.css.map((url) => `<link rel="stylesheet" crossorigin href="${escape(url)}">`),
  ];
  return `<!doctype html><html lang="${escape(record.locales.default)}"><head>${head.join("")}</head><body class="bg-background text-foreground"><div id="root"></div><script type="module" crossorigin src="${escape(shell.entry)}"></script></body></html>`;
}
