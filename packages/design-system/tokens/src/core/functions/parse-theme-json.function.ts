/**
 * Stackra file contract:
 * Purpose: reads a theme from JSON text. It accepts three shapes:
 *          - a full export (`stackra.theme/1`), whose `theme` is checked;
 *          - a changes-only export (`stackra.theme-diff/1`), whose `changes` are applied to `base`;
 *          - a bare theme object.
 *          This is the Theme Studio's import.
 * Boundary: pure. The text is untrusted (a person pastes it), so it is size-capped, parsed as JSON only, merged
 *          without following unsafe keys (`mergeTheme`) and checked value by value (`defineTheme`); any failure is an
 *          InvalidThemeError that lists what is wrong.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { defineTheme } from "#core/functions/define-theme.function";
import { mergeTheme } from "#core/functions/merge-theme.function";

/** The largest theme file read, in characters; the stackra theme's full export is about 30 000. */
const MAX_LENGTH = 512_000;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The theme `text` holds, checked.
 *
 * @param text the JSON of a full export, a changes-only export or a bare theme
 * @param base the theme a changes-only export applies to
 * @throws InvalidThemeError when the text is too long, not JSON, of an unknown format or not a usable theme
 */
export function parseThemeJson(text: string, base: Theme): Theme {
  if (text.length > MAX_LENGTH)
    throw new InvalidThemeError("", [`the file is over ${MAX_LENGTH} characters`]);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new InvalidThemeError("", ["the file is not JSON"]);
  }
  if (!isRecord(data)) throw new InvalidThemeError("", ["the file is not a JSON object"]);
  if (data.format === THEME_JSON_FORMATS.theme) return defineTheme(data.theme as Theme);
  if (data.format === THEME_JSON_FORMATS.diff) {
    if (!isRecord(data.changes)) throw new InvalidThemeError("", ["changes is not an object"]);
    return mergeTheme(base, data.changes as ThemeDiff);
  }
  if (data.format !== undefined)
    throw new InvalidThemeError("", [`"${String(data.format)}" is not a theme format`]);
  return defineTheme(data as unknown as Theme);
}
