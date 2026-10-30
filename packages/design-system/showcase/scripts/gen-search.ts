/**
 * Stackra file contract:
 * Purpose: gen-search: build `search/index.json`, one `SearchDoc` per registry entry and locale (en, ar), from the
 *          `showcase::` catalogues and the generated ApiDocs (prop names).
 * Boundary: pure; gen.ts writes what it returns. A missing Arabic string falls back to English (the check gate
 *           reports it).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.5.
 */
import { componentKeys } from "../src/registry/component-keys.function.ts";
import { lookupMessage } from "../src/registry/lookup-message.function.ts";
import type { ApiDoc } from "../src/types/api-doc.type.ts";
import type { ComponentEntry } from "../src/types/component-entry.type.ts";
import type { SearchDoc } from "../src/types/search-doc.type.ts";

/** Every SearchDoc, entries in the given order, en before ar. */
export function genSearch(
  entries: readonly ComponentEntry[],
  docs: readonly ApiDoc[],
  catalogues: Readonly<Record<"en" | "ar", unknown>>,
): SearchDoc[] {
  const out: SearchDoc[] = [];
  for (const entry of entries) {
    const key = `${entry.tier}/${entry.slug}`;
    const keys = componentKeys(entry);
    const propNames = [
      ...new Set(
        docs
          .filter((doc) => doc.key === key)
          .flatMap((doc) => doc.parts.flatMap((part) => [...part.props, ...(part.events ?? [])]))
          .map((prop) => prop.name)
          .filter((name) => !name.startsWith("...")),
      ),
    ].toSorted();
    for (const lang of ["en", "ar"] as const) {
      const text = (id: string) =>
        lookupMessage(catalogues[lang], id) ?? lookupMessage(catalogues.en, id) ?? "";
      const words = text(keys.keywords)
        .split(/[,،]/)
        .map((word) => word.trim())
        .filter(Boolean);
      out.push({
        key,
        tier: entry.tier,
        category: entry.category,
        platforms: entry.platforms,
        lang,
        title: text(keys.title) || entry.exportName,
        description: text(keys.description),
        keywords: [...new Set(lang === "en" ? [...entry.keywords, ...words] : words)],
        headings: Object.values(keys.examples)
          .map((example) => text(example.title))
          .filter(Boolean),
        propNames,
      });
    }
  }
  return out;
}
