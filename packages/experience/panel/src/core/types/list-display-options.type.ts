/**
 * Stackra file contract:
 * Purpose: `ListDisplayOptions<O, K>`, the options of `d.list(path, options)` in a widget display: which item paths are
 *          a row's primary, secondary and meta text.
 * Boundary: a type only; `Display` and `DisplayRecord` both take it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 14).
 */
import type { ElementOf } from "#core/types/element-of.type";
import type { ListPath } from "#core/types/list-path.type";
import type { Path } from "#core/types/path.type";

/** The text paths of one row of the list field `K` of `O`. */
export interface ListDisplayOptions<O, K extends ListPath<O>> {
  /** The row's main text. */
  readonly primary: Path<ElementOf<NonNullable<O[K]>>>;
  /** The row's second line. */
  readonly secondary?: Path<ElementOf<NonNullable<O[K]>>>;
  /** The row's trailing text. */
  readonly meta?: Path<ElementOf<NonNullable<O[K]>>>;
}
