/**
 * Stackra file contract:
 * Purpose: `SiteFooterBlock`, the document side of the landing's footer (`./react`'s `SiteFooterBlock`): the link
 *          groups and the legal line.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The locale switcher is the app's element, so no field. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The site footer a document places. */
export class SiteFooterBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.siteFooter,
}) {
  groups!: {
    title: LocalizedText;
    links: { label: LocalizedText; href: string; isExternal?: boolean }[];
  }[];

  /** "Stackra is made by Figentra Technologies L.L.C". */
  legal!: LocalizedText;
}
