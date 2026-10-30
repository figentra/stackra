/**
 * Stackra file contract:
 * Purpose: `filterCommands`, a command palette's sections narrowed to the commands whose label, description or
 *          keywords hold every word of the query (folded: case, accents, Arabic diacritics); empty sections drop.
 * Boundary: pure; an empty query keeps everything.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same matching on web and native); STA-1371.
 */
import type { CommandSection } from "#contracts/types/command-section.type";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/** The sections and commands that match `query`. */
export function filterCommands(
  sections: readonly CommandSection[],
  query: string,
): CommandSection[] {
  const words = query.split(/\s+/u).map(normalizeSearchText).filter(Boolean);
  if (words.length === 0) return [...sections];
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const haystack = normalizeSearchText(
          `${item.label} ${item.description ?? ""} ${item.keywords ?? ""}`,
        );
        return words.every((word) => haystack.includes(word));
      }),
    }))
    .filter((section) => section.items.length > 0);
}
