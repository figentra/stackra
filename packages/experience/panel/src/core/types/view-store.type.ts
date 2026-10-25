/**
 * Stackra file contract:
 * Purpose: `ViewStore`, the port the panel keeps saved views through: list a resource's views the viewer may see, save
 *          one, remove one.
 * Boundary: a type only; the driver is the host's (the OS experience service in the console). The driver applies the
 *           session: a private view reaches its owner only, a scope view everyone in the owner's scope, and only the
 *           owner may change or remove a view.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 13 as reopened).
 */
import type { SavedView } from "#core/schemas/saved-view.schema";

/** Where saved views live. */
export interface ViewStore {
  /** The views of `resource` the viewer may see, in the store's order. */
  list(resource: string): Promise<readonly SavedView[]>;

  /** Stores `view`, new or changed; resolves with what was stored. */
  save(view: SavedView): Promise<SavedView>;

  /** Removes the view `id`; a view that is not there is not an error. */
  remove(id: string): Promise<void>;
}
