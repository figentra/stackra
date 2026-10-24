/**
 * Stackra file contract:
 * Purpose: one step of a Breadcrumbs trail: its key, its text and where it goes. The list of them is the `items`
 *          prop, so both runtimes draw the same trail from the same data.
 * Boundary: types only. The last item of a trail is the current page: it is drawn as text and takes no `href`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0313 (the `items` row).
 */
import type { CollectionItem } from "#contracts/types/collection-item.type";

/** One step of a Breadcrumbs trail. */
export interface BreadcrumbItem extends CollectionItem {
  /** The text of the step; it is the step's accessible name. */
  readonly label: string;
  /** Where the step goes: an app path for the router, or an absolute URL. Left out, the step is not a link. */
  readonly href?: string | undefined;
  /** Called when the step is activated, before it follows `href`; a step with only this is a press-only link. */
  readonly onPress?: (() => void) | undefined;
}
