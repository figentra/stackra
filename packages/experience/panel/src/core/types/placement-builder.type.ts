/**
 * Stackra file contract:
 * Purpose: `PlacementBuilder`, one placed button under construction: the bulk bar, the places it is narrowed to, and where a
 *          create goes after.
 * Boundary: a type only; chainable. `then` names a page, so a placement is never awaited.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: `.in(...)` narrows, `.bulk()` adds the bulk bar).
 */
import type { ActionPlace } from "#core/enums/action-place.enum";
import type { ResourcePage } from "#core/enums/resource-page.enum";
import type { Built } from "#core/types/built.type";
import type { PlacementNode } from "#core/types/placement-node.type";

/** One placed button. */
export interface PlacementBuilder extends Built<PlacementNode> {
  /** Adds the bulk bar, fanned out with the policy per record. */
  bulk(): this;

  /** Narrows the places. */
  in(...places: readonly ActionPlace[]): this;

  /** The page the panel opens after a create. */
  then(page: ResourcePage): this;
}
