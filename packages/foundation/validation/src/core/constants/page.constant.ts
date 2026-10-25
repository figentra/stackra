/**
 * Stackra file contract:
 * Purpose: `Page`, the namespace of the cursor page shape: `Page.of(Item)` gives the output of a list query, with
 *          `items`, `nextCursor` (absent on the last page) and `hasMore`.
 * Boundary: a frozen namespace object; `of` returns a fresh shape class whose kind record keeps `{ page: Item }`. Gen
 *           compiles the page's fields over the item's schema and registers the author's subclass, as for any shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 26: `Page.of(X)` is a Schema form); the HTTP conventions (cursor
 *                     pagination).
 */
import type { AnyClass } from "@stackra/container";

import { deriveShape } from "#core/functions/derive-shape.function";
import type { ShapeClass } from "#core/types/shape-class.type";

/**
 * Builds cursor page shapes.
 *
 * @example
 * export class StorefrontProductPage extends Page.of(StorefrontProductCard) {}
 * // { items: StorefrontProductCard[]; nextCursor?: string; hasMore: boolean }
 */
export const Page = Object.freeze({
  /**
   * The page shape of `item`.
   *
   * @param item - the shape of one item.
   */
  of<T extends object>(
    item: AnyClass<T>,
  ): ShapeClass<{ items: T[]; nextCursor?: string; hasMore: boolean }> {
    return deriveShape(`Page.of(${item.name})`, { page: item }) as unknown as ShapeClass<{
      items: T[];
      nextCursor?: string;
      hasMore: boolean;
    }>;
  },
});
