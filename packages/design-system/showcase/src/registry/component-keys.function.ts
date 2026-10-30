/**
 * Stackra file contract:
 * Purpose: `componentKeys`, the `showcase::` catalogue keys an entry implies: title, description, keywords and per example
 *          a title and a note.
 * Boundary: a pure function; the keys exist in `assets/lang/{en,ar}/showcase.json` (the gate checks them).
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import { langSegment } from "#src/registry/lang-segment.function";
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The catalogue keys of `entry`. Example notes are optional; every other key is required in both locales. */
export function componentKeys(entry: Pick<ComponentEntry, "tier" | "slug" | "examples">): {
  readonly title: string;
  readonly description: string;
  readonly keywords: string;
  readonly examples: Readonly<Record<string, { readonly title: string; readonly note: string }>>;
} {
  const base = `${entry.tier}.${langSegment(entry.slug)}`;
  return {
    title: `showcase::component.${base}.title`,
    description: `showcase::component.${base}.description`,
    keywords: `showcase::component.${base}.keywords`,
    examples: Object.fromEntries(
      entry.examples.map((example) => {
        const prefix = `showcase::example.${base}.${langSegment(example.id)}`;
        return [example.id, { title: `${prefix}.title`, note: `${prefix}.note` }];
      }),
    ),
  };
}
