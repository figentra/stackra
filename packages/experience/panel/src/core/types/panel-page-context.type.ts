/**
 * Stackra file contract:
 * Purpose: `PanelPageContext`, the part of an AI page context a panel page publishes on its own: the record it shows,
 *          the rows selected in its list and the filters applied to it.
 * Boundary: a type only, structural: it matches the `record`, `selection` and `filters` fields of `@stackra/ai`'s
 *           `PageContext` without importing that package (ADR 0490 decision 5). Public ids and declared filter keys
 *           only, never a row's or record's field values. The SDK adds the app, route and params.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 5: panel pages publish their context without a declaration); STA-1631.
 */

/** What a panel page publishes as page context. */
export interface PanelPageContext {
  /** The public id of the record the page shows. */
  readonly record?: string;

  /** The selected rows: at most 200 ids, and how many rows are selected in all. */
  readonly selection?: { readonly ids: readonly string[]; readonly count: number };

  /** The applied filters by declared key: text, numbers, flags and short lists of text. */
  readonly filters?: Readonly<Record<string, string | number | boolean | readonly string[]>>;
}
