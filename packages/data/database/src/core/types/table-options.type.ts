/**
 * Stackra file contract:
 * Purpose: `TableOptions<M>`, what a list query adds to a table read: the rows it may see (a customer sees their own)
 *          and the relations to load with each row.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 2: `CrudService.table(input, { where })`).
 */
import type { FindOptions } from "@mikro-orm/core";

import type { Where } from "#contracts/types/where.type";

/** The table read options. */
export interface TableOptions<M extends object, H extends string = never> {
  /** The rows the caller may see, added to the input's filters. */
  readonly where?: Where<M>;

  /** The relations loaded with each row. */
  readonly populate?: FindOptions<M, H>["populate"];
}
