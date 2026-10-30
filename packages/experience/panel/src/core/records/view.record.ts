/**
 * Stackra file contract:
 * Purpose: `ViewRecord<R, I>`, one preset view under construction: the runtime side of `ViewBuilder<R, I>`.
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
  readonly input?: Readonly<Record<string, unknown>>;
}

/** One preset view. */
export class ViewRecord<R, I = Readonly<Record<string, unknown>>>
  extends DraftRecord<ViewFlags, ViewNode>
  implements ViewBuilder<R, I>
{
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

  /** Reads the view with fixed list-query input. */
  input(fixed: { readonly [K in keyof I]?: I[K] }): this {
    return this.set({ input: fixed as Readonly<Record<string, unknown>> });
  }
}
