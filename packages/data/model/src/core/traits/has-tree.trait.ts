/**
 * Stackra file contract:
 * Purpose: `HasTree`, the trait of a model whose records form a hierarchy (categories, organisation units): `parentId`
 *          names the parent record of the same model, and `treePath` is the record's `ltree` path, its ancestors' ids
 *          then its own (`cat_root.cat_shoes.cat_boots`).
 * Boundary: adds the fields only. `treePath` is a system field (`SYSTEM_FIELDS.has_tree`): @stackra/database's
 *           `TreeSubscriber` writes it on insert from the parent's path, and `CrudService.move` rewrites a subtree when
 *           a record changes parent; `children`, `ancestors` and `descendants` read by it through the GiST index of the
 *           blueprint's `t.tree()`. A record's id must be a valid `ltree` label (letters, digits, underscores), which
 *           every `HasPublicId` id is.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (decisions 2 and 4: `HasTree`); ADR 0160 (`ltree`); ADR 0294 (decision 27); data-layer
 *                     gap mo16.
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The tree trait.
 *
 * @example
 * export class Category extends Model.with(HasPublicId("cat"), HasTree) {}
 */
export const HasTree: Trait<{ parentId: string | null; treePath: string }> = createTrait(
  "has_tree",
  (base) =>
    class extends base {
      /** The id of the parent record; null for a root. Set on create; a move goes through `CrudService.move`. */
      parentId: string | null = null;

      /** The `ltree` path from the root to this record, written by the database layer; empty until inserted. */
      treePath = "";
    },
);
