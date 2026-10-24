/**
 * Stackra file contract:
 * Purpose: `ManyToOneOptions`, the options of `@ManyToOne(() => Target, options)`: the foreign key's delete rule.
 * Boundary: a type only. The foreign key name (`fk_<table>_<column>`) and the index are derived by gen. On a link
 *           (`Link<T>`, another module) there is no foreign key, so gen refuses `onDelete` there.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 11, 27 and 28); ADR 0231 (`fk_` names).
 */
import type { OnDelete } from "#core/enums/on-delete.enum";

/** How a many-to-one behaves. */
export interface ManyToOneOptions {
  /** What a delete of the target does to this row; `restrict` by default. */
  readonly onDelete?: OnDelete;
}
