/**
 * Stackra file contract:
 * Purpose: `FiltersRecord<R>`, what a filters callback receives: the runtime side of `FilterFactory<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2).
 */
import { Filter } from "#core/constants/filter.constant";
import { FilterRecord } from "#core/records/filter.record";
import type { FilterFactory } from "#core/types/filter-factory.type";
import type { Path } from "#core/types/path.type";

/** Builds filters over row type `R`. */
export class FiltersRecord<R> implements FilterFactory<R> {
  /** A filter rendered from the field's type. */
  from(key: Path<R>): FilterRecord {
    return new FilterRecord((flags) => Filter.from(key, flags));
  }

  /** A principal picker. */
  principal(key: Path<R>): FilterRecord {
    return new FilterRecord((flags) => Filter.principal(key, flags));
  }

  /** The trashed filter; it takes no flags. */
  trashed(): FilterRecord {
    return new FilterRecord(() => Filter.trashed());
  }
}
