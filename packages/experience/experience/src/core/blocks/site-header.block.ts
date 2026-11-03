/**
 * Stackra file contract:
 * Purpose: `SiteHeaderBlock`, the document side of the landing's top bar (`./react`'s `SiteHeaderBlock`): the site's
 *          section links, the docs search, the ask-AI link and the code host link.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The brand and the switchers are the app's elements, so no field. The key is derived
 *           by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The site header a document places. */
export class SiteHeaderBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.siteHeader,
}) {
  links!: { label: LocalizedText; href: string }[];

  navLabel?: LocalizedText;

  docsSearch!: { label: LocalizedText; href: string };

  askAi?: { label: LocalizedText; href: string };

  githubHref!: string;
}
