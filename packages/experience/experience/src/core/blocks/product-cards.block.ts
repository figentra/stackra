/**
 * Stackra file contract:
 * Purpose: `ProductCardsBlock`, the document side of the landing's "Built on Stackra" cards (`./react`'s
 *          `ProductCards`): the products, each in its own theme, as a strip or a grid.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. A product's name is a name, never translated. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The product cards a document places. */
export class ProductCardsBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.productCards,
}) {
  /** `theme` names a theme the app loads (`pay`, `commerce`). */
  products!: {
    id: string;
    name: string;
    descriptor: LocalizedText;
    href?: string;
    theme?: string;
  }[];

  layout?: "strip" | "grid";
}
