/**
 * Stackra file contract:
 * Purpose: `AskAiBlock`, the document side of the landing's ask-the-docs field (`./react`'s `AskAi`): its label,
 *          the docs URL, the placeholder, whether it is still coming and the note that says so.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.ask_ai`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The ask-the-docs field a document places. */
export class AskAiBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.askAi,
}) {
  /** The field's label. */
  label!: LocalizedText;

  /** The docs the question is asked of. */
  docsUrl!: string;

  /** The words in the empty field. */
  placeholder?: LocalizedText;

  /** True (the component's default) until the AI gateway is live. */
  isComingSoon?: boolean;

  /** The words that say it is coming, shown and announced while `isComingSoon`. */
  comingSoonNote?: LocalizedText;
}
