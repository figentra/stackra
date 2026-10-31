/**
 * Stackra file contract:
 * Purpose: `createThemeDocument`: a theme built in the Theme Studio (or any theme) as a storable document, its
 *          changes over the base only, so it stays small and a base update reaches every unchanged token.
 * Boundary: pure; writes no file and stores nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, section 7).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDocument } from "#contracts/types/theme-document.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { TOKEN_SET_VERSION } from "#core/constants/token-set-version.constant";
import { diffTheme } from "#core/functions/diff-theme.function";

/**
 * `theme` as a document over `base`.
 *
 * @param base the theme the document's changes apply to
 * @param theme the theme to store
 * @param frame the id, label and status the document carries (draft unless said)
 */
export function createThemeDocument(
  base: Theme,
  theme: Theme,
  frame: { readonly id: string; readonly label: string; readonly status?: ThemeDocument["status"] },
): ThemeDocument {
  const { name: _name, ...changes } = diffTheme(base, theme);
  return {
    format: THEME_JSON_FORMATS.document,
    id: frame.id,
    label: frame.label,
    base: base.name,
    tokenSet: TOKEN_SET_VERSION,
    status: frame.status ?? "draft",
    changes,
  };
}
