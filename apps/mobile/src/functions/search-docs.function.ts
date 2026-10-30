/**
 * Stackra file contract:
 * Purpose: `searchDocs`, the search index of the mobile showcase built from the registry and the catalogue of the
 *          current locale: one `SearchDoc` per entry, with its translated title, description, keywords and example
 *          headings, so the home's header search and the Search tab run `matchEntries` over it.
 * Boundary: a pure function over the registry and a translator. shortcut: built at runtime from the registry, with no
 *           prop names, until WP2 writes `@stackra/showcase/search/index.json`; then load that file instead.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5.
 */
import type { I18nKey } from "@stackra/i18n";
import {
  COMPONENTS,
  componentKeys,
  entryKey,
  type ComponentEntry,
  type SearchDoc,
} from "@stackra/showcase";

/** The search docs of `entries` in `lang`, worded by `t`. */
export function searchDocs(
  t: (key: I18nKey) => string,
  lang: string,
  entries: readonly ComponentEntry[] = COMPONENTS,
): SearchDoc[] {
  return entries.map((entry) => {
    const keys = componentKeys(entry);
    return {
      key: entryKey(entry),
      tier: entry.tier,
      category: entry.category,
      platforms: entry.platforms,
      lang,
      title: t(keys.title as I18nKey),
      description: t(keys.description as I18nKey),
      keywords: t(keys.keywords as I18nKey)
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      headings: Object.values(keys.examples).map((example) => t(example.title as I18nKey)),
      propNames: [],
    };
  });
}
