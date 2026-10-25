/**
 * Stackra file contract:
 * Purpose: `ViewRecord<R>`, one preset view under construction: the runtime side of `ViewBuilder<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 9).
 */
import type { SortDirection } from "@stackra/contracts";

import { View } from "#core/constants/view.constant";
import { DraftRecord } from "#core/records/draft.record";
import type { Path } from "#core/types/path.type";
import type { SortNode } from "#core/types/sort-node.type";
import type { ViewBuilder } from "#core/types/view-builder.type";
import type { ViewNode } from "#core/types/view-node.type";

/** The flags a view records. */
interface ViewFlags {
  readonly sort?: SortNode;
}

/** One preset view. */
export class ViewRecord<R> extends DraftRecord<ViewFlags, ViewNode> implements ViewBuilder<R> {
  /**
   * @param name - the view name.
   * @param filter - the filter values by row path.
   */
  constructor(name: string, filter: Readonly<Record<string, unknown>>) {
    super((flags) => View.of(name, filter, flags), {});
  }

  /** Sorts the view. */
  sort(key: Path<R>, direction: SortDirection): this {
    return this.set({ sort: Object.freeze({ key, direction }) });
  }
}
