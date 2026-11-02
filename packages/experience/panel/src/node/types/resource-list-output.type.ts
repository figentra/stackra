/**
 * Stackra file contract:
 * Purpose: `ResourceListOutput`, what a generated list read answers: a page of rows, the next cursor and whether more
 *          follow (the panel's list page reads `items`, `nextCursor` and `hasMore`).
 * Boundary: a type only; the member's manifest describes it as a `Page` of the resource's row schema.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 1); STA-1971.
 */

/** One page of rows. */
export interface ResourceListOutput {
  /** The rows of the page, in order. */
  readonly items: readonly Readonly<Record<string, unknown>>[];

  /** The cursor of the next page; absent on the last page. */
  readonly nextCursor?: string;

  /** Whether a next page exists. */
  readonly hasMore: boolean;
}
