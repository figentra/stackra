/**
 * Stackra file contract:
 * Purpose: `searchDocs`, the search index of the palette in one locale, built from the registry and the `showcase`
 *          catalogue: one `SearchDoc` per entry with its title, description, keywords and example headings.
 * Boundary: a pure function. Prop names stay empty until the generated `@stackra/showcase/search` index (WP2)
 *           replaces this builder; the shape is the same, so the swap is one import.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5.
 */
import type { Messages } from "@stackra/i18n";
import {
  componentKeys,
  COMPONENTS,
  entryKey,
  lookupMessage,
  type ComponentEntry,
  type SearchDoc,
} from "@stackra/showcase";

/** Splits a keywords message on Latin and Arabic commas. */
const split = (value: string) =>
  value
    .split(/[,،]/)
    .map((word) => word.trim())
    .filter(Boolean);

/** The search docs of `entries` in the locale of `messages` (its `showcase` namespace). */
export function searchDocs(
  messages: Messages,
  lang: string,
  entries: readonly ComponentEntry[] = COMPONENTS,
): SearchDoc[] {
  const catalogue = messages["showcase"];
  return entries.map((entry) => {
    const keys = componentKeys(entry);
    const keywords = lookupMessage(catalogue, keys.keywords);
    return {
      key: entryKey(entry),
      tier: entry.tier,
      category: entry.category,
      platforms: entry.platforms,
      lang,
      title: lookupMessage(catalogue, keys.title) ?? entry.exportName,
      description: lookupMessage(catalogue, keys.description) ?? "",
      keywords: [...entry.keywords, ...(keywords ? split(keywords) : [])],
      headings: entry.examples
        .map((example) => lookupMessage(catalogue, keys.examples[example.id]?.title ?? ""))
        .filter((heading) => heading !== undefined),
      // shortcut: no prop names until WP2 generates `search/index.json`; then import that file here instead.
      propNames: [],
    };
  });
}
