/**
 * Stackra file contract:
 * Purpose: `ViewBuilder<R>`, one preset view under construction: its sort.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 9).
 */
import type { SortDirection } from "@stackra/contracts";

import type { Built } from "#core/types/built.type";
import type { Path } from "#core/types/path.type";
import type { ViewNode } from "#core/types/view-node.type";

/** One preset view. */
export interface ViewBuilder<R> extends Built<ViewNode> {
  /** Sorts the view by `key`. */
  sort: (key: Path<R>, direction: SortDirection) => this;
}
