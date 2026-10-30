/**
 * Stackra file contract:
 * Purpose: `ViewBuilder<R, I>`, one preset view under construction: its sort and its fixed list-query input.
 * Boundary: a type only; chainable. `I` is the list query's input, so a fixed input names only its keys.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 9).
 */
import type { SortDirection } from "@stackra/contracts";

import type { Built } from "#core/types/built.type";
import type { Path } from "#core/types/path.type";
import type { ViewNode } from "#core/types/view-node.type";

/** One preset view. */
export interface ViewBuilder<R, I = Readonly<Record<string, unknown>>> extends Built<ViewNode> {
  /** Sorts the view by `key`. */
  sort: (key: Path<R>, direction: SortDirection) => this;

  /** Reads the view with `fixed` list-query input, under the user's filters, sort, search and cursor. */
  input: (fixed: { readonly [K in keyof I]?: I[K] }) => this;
}
