/**
 * Stackra file contract:
 * Purpose: `classifyOptionsOf`, the constant `{ key, ...effects }` of the data class a model field's `@Classify` facet
 *          names, as the source reader recorded it on the facet (`options.dataClass`).
 * Boundary: pure, over one declared class; undefined when the field has no `@Classify` or gen could not read the
 *           class's `DataClass({...})` call.
 * Runtime: isomorphic
 * Governing contract: ADR 0540 (decision 4); ADR 0341 (decision 4); STA-1251 (`dataClass` on a `@Classify` facet).
 */
import type { DeclaredClass } from "#core/types/declared-class.type";

/**
 * The `@Classify` class options on `field` of `declared`.
 *
 * @example
 * classifyOptionsOf(caseNote, "body"); // { key: "clinical_note", ai: "never", ... }
 */
export function classifyOptionsOf(
  declared: DeclaredClass,
  field: string,
): Readonly<Record<string, unknown>> | undefined {
  const facet = declared.facets.find(
    (candidate) =>
      candidate.name === "Classify" && candidate.target === "field" && candidate.member === field,
  );
  const dataClass = (facet?.options as { readonly dataClass?: unknown } | undefined)?.dataClass;
  return typeof dataClass === "object" && dataClass !== null
    ? (dataClass as Readonly<Record<string, unknown>>)
    : undefined;
}
