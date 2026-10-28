/**
 * Stackra file contract:
 * Purpose: `PageOptions<M, H>`, what `Repository.page(input, options)` takes beside the input: the rows the caller may
 *          see, the relations loaded with each row, and the hidden-row switches.
 * Boundary: a type only; `where` is ANDed with the bound `VisibilityFilter`'s conditions, as every read is.
 * Runtime: node
 * Governing contract: data-layer gap mo14 (stackra-280); ADR 0134 (decision 4).
 */
import type { FindOptions } from "@mikro-orm/core";

import type { DeletedReadOptions } from "#core/types/deleted-read-options.type";
import type { Where } from "#contracts/types/where.type";

/** The offset page options. */
export interface PageOptions<
  M extends object,
  H extends string = never,
> extends DeletedReadOptions {
  /** The rows the caller may see. */
  readonly where?: Where<M>;

  /** The relations loaded with each row. */
  readonly populate?: FindOptions<M, H>["populate"];
}
