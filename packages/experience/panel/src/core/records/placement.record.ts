/**
 * Stackra file contract:
 * Purpose: `PlacementRecord`, one placed button under construction: the runtime side of `PlacementBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it. It is never awaited: `then(page)` records the page as `after`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3).
 */
import type { ActionPlace } from "#core/enums/action-place.enum";
import type { ResourcePage } from "#core/enums/resource-page.enum";
import { DraftRecord } from "#core/records/draft.record";
import type { PlacementBuilder } from "#core/types/placement-builder.type";
import type { PlacementNode } from "#core/types/placement-node.type";

/** The flags a placement records. */
interface PlacementFlags {
  readonly bulk?: boolean;
  readonly places?: readonly ActionPlace[];
  readonly after?: ResourcePage;
}

/** One placed button. */
export class PlacementRecord
  extends DraftRecord<PlacementFlags, PlacementNode>
  implements PlacementBuilder
{
  /**
   * @param build - the `Placement` constructor call for the recorded flags.
   */
  constructor(build: (flags: PlacementFlags) => PlacementNode) {
    super(build, {});
  }

  /** Adds the bulk bar. */
  bulk(): this {
    return this.set({ bulk: true });
  }

  /**
   * Narrows the places.
   *
   * @throws RangeError when no place is given.
   */
  in(...places: readonly ActionPlace[]): this {
    if (places.length === 0) throw new RangeError("in(...places) needs at least one place");
    return this.set({ places });
  }

  /** The page after a create. */
  // oxlint-disable-next-line unicorn/no-thenable -- reason: the template's grammar (`a.create().then(ResourcePage.View)`); a placement is never awaited
  then(page: ResourcePage): this {
    return this.set({ after: page });
  }
}
