/**
 * Stackra file contract:
 * Purpose: `docKeys`, the `showcase::doc.*` catalogue keys of an entry's doc page: the hero (headline, intro, tags), the
 *          pillars (what, when), the RTL note and, from its `COMPONENT_DOCS` row, the when-not line, the do/don't rules,
 *          the anatomy labels (shared `doc.anatomy.<id>`), the alternative reasons and the keyboard action words.
 * Boundary: a pure function; the hero, pillar and RTL keys are required in both locales (the gate checks them), the
 *           rest only when the doc row names them.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (doc pages wave, 2026-10-28); showcase redesign spec (2026-10-27) section 2.1.
 */
import { COMPONENT_DOCS } from "#src/registry/component-docs.constant";
import { DOC_FIELDS } from "#src/registry/doc-fields.constant";
import { entryKey } from "#src/registry/entry-key.function";
import { langSegment } from "#src/registry/lang-segment.function";
import type { ComponentEntry } from "#src/types/component-entry.type";
import type { KeyboardRow } from "#src/types/keyboard-row.type";

/** The doc keys of `entry`. */
export function docKeys(entry: Pick<ComponentEntry, "tier" | "slug">): {
  fields: Record<(typeof DOC_FIELDS)[number], string>;
  whenNot: string | undefined;
  do: string[];
  dont: string[];
  anatomy: { id: string; label: string }[];
  alternatives: { key: string; reason: string }[];
  keyboard: { keys: KeyboardRow["keys"]; action: string }[];
} {
  const base = `showcase::doc.component.${entry.tier}.${langSegment(entry.slug)}`;
  const doc = COMPONENT_DOCS[entryKey(entry)];
  const range = (prefix: string, count = 0) =>
    Array.from({ length: count }, (_, index) => `${base}.${prefix}_${index + 1}`);
  return {
    fields: Object.fromEntries(DOC_FIELDS.map((field) => [field, `${base}.${field}`])) as Record<
      (typeof DOC_FIELDS)[number],
      string
    >,
    whenNot: doc?.rules ? `${base}.when_not` : undefined,
    do: range("do", doc?.rules?.do),
    dont: range("dont", doc?.rules?.dont),
    anatomy: (doc?.anatomy ?? []).map((id) => ({ id, label: `showcase::doc.anatomy.${id}` })),
    alternatives: (doc?.alternatives ?? []).map((key) => ({
      key,
      reason: `${base}.alternative.${langSegment(key.slice(key.indexOf("/") + 1))}`,
    })),
    keyboard: (doc?.keyboard ?? []).map((row) => ({
      keys: row.keys,
      action: `showcase::doc.key_action.${row.action}`,
    })),
  };
}
