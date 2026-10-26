/**
 * Stackra file contract:
 * Purpose: `checkCatalogues(files, read)`, the catalogue-completeness gate: per member and locale, every lang file against
 *          its English source — a base language misses no namespace or key of `en`, no catalogue holds a key `en`
 *          lacks, a regional overlay holds only `en` keys, every message names the same ICU placeholders as its source,
 *          every file parses, and the framework UI members ship all seven base languages.
 * Boundary: pure apart from `read`. Keys and placeholders only: whether a message reads well is the native-speaker review
 *           (ADR 0192). Files under `tools/scaffold/` are skipped.
 * Runtime: node
 * Governing contract: ADR 0403; ADR 0305 (rule 1); ADR 0192.
 */
import { BASE_LANGUAGES } from "#node/constants/base-languages.constant";
import { LANG_FILE_PATTERN } from "#node/constants/lang-file-pattern.constant";
import { SEVEN_LANGUAGE_MEMBERS } from "#node/constants/seven-language-members.constant";
import { messagesOf } from "#node/functions/messages-of.function";
import { placeholdersOf } from "#node/functions/placeholders-of.function";

/** Placeholder names as a finding writes them. */
const listOf = (names: readonly string[]): string =>
  names.length === 0 ? "none" : names.map((name) => `{${name}}`).join(", ");

/**
 * The findings for the lang files among `files`.
 *
 * @param files - repository-relative paths; non-lang paths are ignored.
 * @param read - returns the text of a path.
 * @example
 * checkCatalogues(["packages/x/assets/lang/fr/a.json"], read); // ["packages/x/assets/lang: no en catalogue, …"]
 */
export function checkCatalogues(
  files: readonly string[],
  read: (path: string) => string,
): string[] {
  const findings: string[] = [];
  /** member → locale → namespace → messages */
  const members = new Map<string, Map<string, Map<string, Map<string, unknown>>>>();
  for (const path of files) {
    const match = LANG_FILE_PATTERN.exec(path);
    if (match === null || path.startsWith("tools/scaffold/")) continue;
    const [, root = "", locale = "", namespace = ""] = match;
    let keys: Map<string, unknown>;
    try {
      keys = messagesOf(JSON.parse(read(path)));
    } catch (error) {
      findings.push(
        `${path}: not valid JSON (${error instanceof Error ? error.message : String(error)})`,
      );
      continue;
    }
    const locales = members.get(root) ?? new Map<string, Map<string, Map<string, unknown>>>();
    members.set(root, locales);
    const namespaces = locales.get(locale) ?? new Map<string, Map<string, unknown>>();
    locales.set(locale, namespaces);
    namespaces.set(namespace, keys);
  }
  for (const [root, locales] of members) {
    const source = locales.get("en");
    if (source === undefined) {
      findings.push(
        `${root}/assets/lang: no en catalogue, the source every locale is checked against`,
      );
      continue;
    }
    if (SEVEN_LANGUAGE_MEMBERS.includes(root))
      for (const language of BASE_LANGUAGES)
        if (!locales.has(language))
          findings.push(
            `${root}/assets/lang/${language}: missing; this member ships all seven languages`,
          );
    for (const [locale, namespaces] of locales) {
      if (locale === "en") continue;
      const overlay = locale.includes("-");
      if (!overlay)
        for (const namespace of source.keys())
          if (!namespaces.has(namespace))
            findings.push(`${root}/assets/lang/${locale}/${namespace}.json: missing`);
      for (const [namespace, keys] of namespaces) {
        const file = `${root}/assets/lang/${locale}/${namespace}.json`;
        const english = source.get(namespace);
        if (english === undefined) {
          findings.push(`${file}: no en/${namespace}.json to translate from`);
          continue;
        }
        if (!overlay)
          for (const key of english.keys())
            if (!keys.has(key)) findings.push(`${file}: misses key ${key}`);
        for (const [key, message] of keys) {
          if (!english.has(key)) {
            findings.push(`${file}: key ${key} is not in en`);
            continue;
          }
          const sourceMessage = english.get(key);
          if (typeof message !== "string" || typeof sourceMessage !== "string") continue;
          const expected = placeholdersOf(sourceMessage);
          const found = placeholdersOf(message);
          if (found === null) findings.push(`${file}: key ${key} is not a valid ICU message`);
          else if (expected !== null && expected.join(",") !== found.join(","))
            findings.push(
              `${file}: key ${key} has placeholders ${listOf(found)}, en has ${listOf(expected)}`,
            );
        }
      }
    }
  }
  return findings;
}
