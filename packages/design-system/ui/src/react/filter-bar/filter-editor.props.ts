/**
 * Stackra file contract:
 * Purpose: `FilterEditorProps`, the props of the web `FilterEditor` in `filter-editor.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318 (decisions
 *          3 and 4); ADR 0055 (forms); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";

/** Props of {@link FilterEditor}. */
export interface FilterEditorProps {
  /** The filter being edited; its kind picks the editor. */
  readonly definition: FilterDefinition;
  /** What the query holds for the filter, or `undefined` when it holds nothing. */
  readonly value: FilterValue | undefined;
  /** Called with the whole next value, or `undefined` to drop the filter. */
  readonly onChange: (value: FilterValue | undefined) => void;
}
