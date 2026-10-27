/**
 * Stackra file contract:
 * Purpose: reads a theme from JSON text. It accepts three shapes:
 *          - a full export (`stackra.theme/1`), whose `theme` is checked;
 *          - a changes-only export (`stackra.theme-diff/2`, or `/1` before the token set was versioned), whose
 *            `changes` move through the path aliases (ADR 0340 decision 6) and are applied to `base`;
 *          - a bare theme object.
 *          This is the Theme Studio's import.
 * Boundary: pure. The text is untrusted (a person pastes it), so it is size-capped, parsed as JSON only, merged
 *          without following unsafe keys (`mergeTheme`) and checked value by value (`defineTheme`); a diff written
 *          for a newer token set than this package's is refused. Any failure is an InvalidThemeError that lists what
 *          is wrong.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (Stackra Design System); ADR 0320 (the Theme Studio); ADR 0340 (decision 6).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDiff } from "#contracts/types/theme-diff.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { TOKEN_SET_VERSION } from "#core/constants/token-set-version.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { aliasThemeDiff } from "#core/functions/alias-theme-diff.function";
import { defineTheme } from "#core/functions/define-theme.function";
import { mergeTheme } from "#core/functions/merge-theme.function";

/** The largest theme file read, in characters; the stackra theme's full export is about 30 000. */
const MAX_LENGTH = 512_000;

/** The changes-only formats this package reads: the current one and the unversioned first one. */
const DIFF_FORMATS: ReadonlySet<unknown> = new Set([
  THEME_JSON_FORMATS.diff,
  "stackra.theme-diff/1",
]);

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The problem with a diff's `tokenSet`, when it has one: not a version, or newer than this package's. */
function tokenSetProblem(tokenSet: unknown): string | undefined {
  if (tokenSet === undefined) return undefined;
  if (typeof tokenSet !== "number" || !Number.isInteger(tokenSet) || tokenSet < 1)
    return "tokenSet is not a token-set version";
  return tokenSet > TOKEN_SET_VERSION
    ? `the file was written for token set ${tokenSet}, newer than this package's ${TOKEN_SET_VERSION}`
    : undefined;
}

/**
 * The theme `text` holds, checked.
 *
 * @param text the JSON of a full export, a changes-only export or a bare theme
 * @param base the theme a changes-only export applies to
 * @throws InvalidThemeError when the text is too long, not JSON, of an unknown format or not a usable theme
 */
export function parseThemeJson(text: string, base: Theme): Theme {
  if (text.length > MAX_LENGTH)
    throw InvalidThemeError.create({
      themeName: "",
      problems: [`the file is over ${MAX_LENGTH} characters`],
    });
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw InvalidThemeError.create({ themeName: "", problems: ["the file is not JSON"] });
  }
  if (!isRecord(data))
    throw InvalidThemeError.create({ themeName: "", problems: ["the file is not a JSON object"] });
  if (data.format === THEME_JSON_FORMATS.theme) return defineTheme(data.theme as Theme);
  if (DIFF_FORMATS.has(data.format)) {
    if (!isRecord(data.changes))
      throw InvalidThemeError.create({ themeName: "", problems: ["changes is not an object"] });
    const problem = tokenSetProblem(data.tokenSet);
    if (problem !== undefined)
      throw InvalidThemeError.create({ themeName: "", problems: [problem] });
    return mergeTheme(base, aliasThemeDiff(data.changes as ThemeDiff));
  }
  if (data.format !== undefined)
    throw InvalidThemeError.create({
      themeName: "",
      problems: [`"${String(data.format)}" is not a theme format`],
    });
  return defineTheme(data as unknown as Theme);
}
