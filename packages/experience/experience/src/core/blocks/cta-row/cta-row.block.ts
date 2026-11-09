/**
 * Stackra file contract:
 * Purpose: `CtaRowBlock`, the document side of the landing's call-to-action row (`./react`'s `CtaRow`): the one
 *          primary link, a copy link and a command chip.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The command is code, never translated. The key is gen's `<member>.<snake(folder)>`,
 *           `experience.cta_row`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { CopyLink } from "#core/types/copy-link.type";
import type { LandingLink } from "#core/types/landing-link.type";

/** The call-to-action row a document places. */
export class CtaRowBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.ctaRow,
}) {
  /** The row's one primary link. */
  primary!: LandingLink;

  /** A button that copies a value, such as the llms.txt URL. */
  copyLink?: CopyLink;

  /** A command shown as a chip, copied on press. */
  command?: string;
}
