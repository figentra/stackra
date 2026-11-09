/**
 * Stackra file contract:
 * Purpose: `StatementBlock`, the document side of the landing's statement (`./react`'s `Statement`): one
 *          paragraph with its `*`-marked steel keywords, and its facts.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.statement`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The statement a document places. */
export class StatementBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.statement,
}) {
  /** Words between two `*` are drawn in steel. */
  text!: LocalizedText;

  /** The facts listed under the paragraph. */
  facts?: LocalizedText[];
}
