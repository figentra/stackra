/**
 * Stackra file contract:
 * Purpose: `BlockCategory`, the palette group a block is listed under in the page builder (`Block({ category:
 *          BlockCategory.Marketing, icon })`).
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case. The label each group shows is the
 *           derived key `experience::enums.block_category.<code>`, never a field here.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3: the palette is code); ADR 0294 (decision 16: `Block({ category, icon })`);
 *                     ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The palette groups of the page builder. */
export const BlockCategory = Enum.of({
  /** Sections, columns and spacers that hold other blocks. */
  Layout: "layout",
  /** Text, lists and content-type feeds. */
  Content: "content",
  /** Images, galleries and video. */
  Media: "media",
  /** Heroes, banners, calls to action and feature grids. */
  Marketing: "marketing",
  /** Products, plans and prices. */
  Commerce: "commerce",
});

/** One of the codes above. */
export type BlockCategory = Enum.Value<typeof BlockCategory>;
