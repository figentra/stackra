/**
 * Stackra file contract:
 * Purpose: the `ViewStore` port: where the panel keeps saved views: list a resource's views the viewer may see, save
 *          one, remove one.
 * Boundary: an abstract class that is its own token, keyed `panel.ViewStore`. The server driver is
 *           `DatabaseViewStoreDriver` (`@stackra/panel/node`); a client passes one that calls the host's view actions.
 *           The driver applies the session: a private view reaches its owner only, a role copy the holders of its role,
 *           a scope view everyone in the owner's scope; only the owner may change or remove a view, and sharing one
 *           needs `panel.view.share`. A save names declared keys only (`unknownViewKeys`) and carries the version it
 *           read; a view changed since is refused as a conflict.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 9); ADR 0271 (decisions 3, 4 and 8).
 */
import { Port } from "@stackra/contracts";

import type { SavedView } from "#core/schemas/saved-view.schema";

/**
 * Where saved views live.
 *
 * @example
 * export class DatabaseViewStoreDriver extends Driver(ViewStore) {
 *   list = async (resource: string) => this.visible(resource);
 * }
 */
export abstract class ViewStore extends Port {
  /** Type-only port key, so `DriverName<ViewStore>` narrows to this port's drivers. */
  declare readonly "~key": "panel.ViewStore";

  /** The views of `resource` the viewer may see, in the store's order. */
  abstract list(resource: string): Promise<readonly SavedView[]>;

  /**
   * Stores `view`, new or changed; resolves with what was stored, its new version included.
   *
   * @throws ViewKeyUnknownError when the view names a key the resource does not declare.
   * @throws a forbidden refusal when the viewer may not share or does not own the view.
   * @throws a conflict refusal when the view's version is no longer the stored one.
   */
  abstract save(view: SavedView): Promise<SavedView>;

  /** Removes the viewer's view `id`; a view that is not there, or not the viewer's, is not an error. */
  abstract remove(id: string): Promise<void>;
}
