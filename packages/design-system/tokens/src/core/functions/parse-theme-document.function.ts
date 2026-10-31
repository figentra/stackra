/**
 * Stackra file contract:
 * Purpose: `parseThemeDocument`: checks a stored theme document (a dashboard's saved theme, a preset seed) and builds
 *          the theme it describes over its base, so a person's theme is data that is validated before it is applied.
 * Boundary: pure; the document's frame (format, id, label, status, base) is checked here and its changes go through
 *           `parseThemeJson` (token-set check, path aliases, `defineTheme`). Any failure is an InvalidThemeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, section 7); ADR 0340 (decision 6).
 */
import type { Theme } from "#contracts/types/theme.type";
import type { ThemeDocument } from "#contracts/types/theme-document.type";
import { THEME_JSON_FORMATS } from "#core/constants/theme-json-formats.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { parseThemeJson } from "#core/functions/parse-theme-json.function";

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The document `input` holds and its theme.
 *
 * @param input a parsed JSON value, as a settings store or an import hands it over
 * @param base the theme the document names as its base
 * @throws InvalidThemeError when the frame is wrong, the base does not match, or the changes are not a usable theme
 */
export function parseThemeDocument(
  input: unknown,
  base: Theme,
): { readonly document: ThemeDocument; readonly theme: Theme } {
  const problems: string[] = [];
  if (!isRecord(input))
    throw InvalidThemeError.create({ themeName: "", problems: ["the document is not an object"] });
  if (input.format !== THEME_JSON_FORMATS.document)
    problems.push(`format is not ${THEME_JSON_FORMATS.document}`);
  if (typeof input.id !== "string" || !ID.test(input.id))
    problems.push("id is not a kebab-case id");
  if (typeof input.label !== "string" || input.label.trim() === "" || input.label.length > 80)
    problems.push("label is not 1 to 80 characters");
  if (input.status !== "draft" && input.status !== "published")
    problems.push("status is not draft or published");
  if (input.base !== base.name) problems.push(`base is not ${base.name}`);
  if (!isRecord(input.changes)) problems.push("changes is not an object");
  if (problems.length > 0)
    throw InvalidThemeError.create({ themeName: String(input.id ?? ""), problems });
  const theme = parseThemeJson(
    JSON.stringify({
      format: THEME_JSON_FORMATS.diff,
      tokenSet: input.tokenSet,
      changes: { name: input.id, ...(input.changes as object) },
    }),
    base,
  );
  return { document: input as unknown as ThemeDocument, theme };
}
