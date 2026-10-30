/**
 * Stackra file contract:
 * Purpose: `importMappingOf`, the automatic first mapping of an import file's columns to fields: a column fills the
 *          field whose key, label or alias it matches once case, accents, Arabic diacritics and punctuation are
 *          folded, each field at most once; anything else is skipped (null).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ImportField } from "#contracts/types/import-field.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";
import { normalizeSearchText } from "#core/functions/normalize-search-text.function";

/** The automatic mapping of `columns` to `fields`. */
export function importMappingOf(
  columns: readonly string[],
  fields: readonly ImportField[],
): ImportMapping {
  const used = new Set<string>();
  const mapping: Record<string, string | null> = {};
  for (const column of columns) {
    const name = normalizeSearchText(column);
    const field = fields.find(
      (candidate) =>
        !used.has(candidate.key) &&
        [candidate.key, candidate.label, ...(candidate.aliases ?? [])].some(
          (word) => normalizeSearchText(word) === name,
        ),
    );
    if (field) used.add(field.key);
    mapping[column] = field?.key ?? null;
  }
  return mapping;
}
