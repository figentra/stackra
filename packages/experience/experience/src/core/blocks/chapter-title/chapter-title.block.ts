/**
 * Stackra file contract:
 * Purpose: `ChapterTitleBlock`, the document side of the landing's chapter title (`./react`'s `ChapterTitle`):
 *          the title, its subtitle and its place in the outline.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.chapter_title`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Int } from "@stackra/validation";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The chapter title a document places. */
export class ChapterTitleBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.chapterTitle,
}) {
  /** The heading level under the hero's `h1`, 2 to 6; 2 when absent. */
  @Int({
    min: 2,
    max: 6,
  })
  level?: number;

  /** The chapter's title. */
  title!: LocalizedText;

  /** The line under the title. */
  subtitle?: LocalizedText;
}
