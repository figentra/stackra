/**
 * Stackra file contract:
 * Purpose: `FilterChipWords`, the translated words a filter chip's value phrase uses: the yes and no of a boolean and
 *          the from and until of an open day range.
 * Boundary: internal type; the filter bars fill it from `ui::filter_bar.*` and pass it to `filterChipTextOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0318 (decision 3); ADR 0080.
 */

/** The words of a filter chip. */
export interface FilterChipWords {
  /** A boolean filter's true word, when the filter names none. */
  readonly yes: string;
  /** A boolean filter's false word, when the filter names none. */
  readonly no: string;
  /** Before the start of a day range with no end. */
  readonly from: string;
  /** Before the end of a day range with no start. */
  readonly until: string;
}
