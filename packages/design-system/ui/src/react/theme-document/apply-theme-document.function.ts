/**
 * Stackra file contract:
 * Purpose: `applyThemeDocument`, the web side of a theme as data (ADR 0501 section 5): validates a stored theme
 *          document, builds its theme over the base and writes it live into one stylesheet of the page (or of one
 *          section, through `scope`), with no rebuild or reload. The appearance settings call it with the document
 *          the person or tenant picked.
 * Boundary: DOM only through the given document; validation and rendering are @stackra/tokens'. One `<style>` per
 *           scope, replaced in place, so applying again swaps the theme. No settings dependency.
 * Runtime: browser
 * Governing contract: ADR 0501 (tokens v2, section 5).
 */
import { parseThemeDocument, renderWebCss, STACKRA_THEME } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

/**
 * Applies `document` live and returns the theme it describes.
 * @param input - a stored theme document (`stackra.theme-document/1`), as JSON-parsed data
 * @param options - the base theme (Stackra's by default), a scope selector for one section, the DOM document
 * @throws InvalidThemeError when the document is not a usable theme; the page keeps its theme
 */
export function applyThemeDocument(
  input: unknown,
  options: {
    readonly base?: Theme | undefined;
    readonly scope?: string | undefined;
    readonly target?: Document | undefined;
  } = {},
): Theme {
  const { theme } = parseThemeDocument(input, options.base ?? STACKRA_THEME);
  const target = options.target ?? document;
  const id = `stackra-theme${options.scope === undefined ? "" : `:${options.scope}`}`;
  let style = target.getElementById(id);
  if (!style) {
    style = target.createElement("style");
    style.id = id;
    target.head.append(style);
  }
  style.textContent = renderWebCss(theme, { scope: options.scope });
  return theme;
}
