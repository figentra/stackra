/**
 * Stackra file contract:
 * Purpose: `tocItems`, the table of contents of a component page from its registry entry: the sections of the page
 *          contract in order (anatomy only for a compound, no header, links or pager rows), the examples under
 *          Examples and the parts under API Reference. The anchors are the section ids, `example-<id>` and
 *          `api-<Part>`; the component page kit (WP5) sets them.
 * Boundary: a pure function; the words come through the `t` it is given.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4.
 */
import type { I18nKey } from "@stackra/i18n";
import {
  COMPONENT_DOCS,
  ComponentSection,
  componentKeys,
  docKeys,
  entryKey,
  sectionKey,
  type ComponentEntry,
} from "@stackra/showcase";

import type { TocItem } from "#src/components/toc-rail/toc-item.type";

/** The sections that are not table-of-contents rows: the title block, the link row and the foot pager. */
const SKIPPED: ReadonlySet<ComponentSection> = new Set(["header", "links", "pager"]);

/** The table of contents of `entry`. */
export function tocItems(entry: ComponentEntry, t: (key: I18nKey) => string): readonly TocItem[] {
  const keys = componentKeys(entry);
  const rows: TocItem[] = [];
  for (const section of ComponentSection) {
    if (SKIPPED.has(section)) continue;
    if (section === "anatomy" && entry.parts.length < 2) continue;
    if (section === "guidance" && !docKeys(entry).whenNot) continue;
    if (section === "playground" && !COMPONENT_DOCS[entryKey(entry)]?.playground) continue;
    rows.push({ id: section, label: t(sectionKey(section) as I18nKey), level: 2 });
    if (section === "examples")
      for (const example of entry.examples.slice(1))
        rows.push({
          id: `example-${example.id}`,
          label: t(keys.examples[example.id]?.title as I18nKey),
          level: 3,
        });
    if (section === "api")
      for (const part of entry.parts) rows.push({ id: `api-${part}`, label: part, level: 3 });
  }
  return rows;
}
