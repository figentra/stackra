/**
 * Stackra file contract:
 * Purpose: `BentoGridBlock`, the document side of the landing's bento grid (`./react`'s `BentoGrid`): its column
 *          count; its cards are the node's children.
 * Boundary: a block declaration only; its fields are the props a document may give it. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The bento grid a document places. */
export class BentoGridBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.bentoGrid,
}) {
  /** Columns on a wide screen; narrow screens stack. */
  columns?: 1 | 2;
}
