/**
 * Stackra file contract:
 * Purpose: `ProductCardsBlock`, the document side of the landing's "Built on Stackra" cards (`./react`'s
 *          `ProductCards`): the group's name, the link words and the products, each in its brand, as a grid or a strip.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. A product's name is a name, never translated. A product's `brand` is resolved to a
 *           theme by the page's `themes` prop, given in code, never by the document. The key is gen's
 *           `<member>.<snake(folder)>`, `experience.product_cards`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { ProductCardsLayout } from "#core/enums/product-cards-layout.enum";
import type { LandingProduct } from "#core/types/landing-product.type";

/** The product cards a document places. */
export class ProductCardsBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.productCards,
}) {
  /** The group's spoken name ("Built on Stackra"). */
  label!: LocalizedText;

  /** The words of a product's link; the product's name when absent. */
  linkLabel?: LocalizedText;

  /** The products, in order. */
  products!: LandingProduct[];

  /** `grid` when absent. */
  layout?: ProductCardsLayout;
}
