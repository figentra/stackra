/**
 * Stackra file contract:
 * Purpose: `CustomWidgetProps<O>`, the props the panel hands a Custom widget's renderer: the bound query's output and the
 *          refresh state.
 * Boundary: a type only; a renderer's own `<Name>Props` declares the same two fields with its output type, so an app's
 *           shadow of it takes the same props.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (0294 note: only Custom takes a renderer); ADR 0306 (rule 5: a shadow keeps the Props).
 */

/** What a Custom renderer receives. */
export interface CustomWidgetProps<O = unknown> {
  /** The bound query's output; absent while loading. */
  readonly data?: O;

  /** True while the panel refreshes the widget. */
  readonly isRefreshing: boolean;
}
