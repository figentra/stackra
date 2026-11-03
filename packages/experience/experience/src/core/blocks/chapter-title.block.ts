/**
 * Stackra file contract:
 * Purpose: `ChapterTitleBlock`, the document side of the landing's chapter title (`./react`'s `ChapterTitleBlock`):
 *          the title, its subtitle and its place in the outline.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The chapter title a document places. */
export class ChapterTitleBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.chapterTitle,
}) {
  title!: LocalizedText;

  subtitle?: LocalizedText;

  /** The heading level under the hero's `h1`; 2 when absent. */
  level?: 2 | 3 | 4 | 5 | 6;
}
