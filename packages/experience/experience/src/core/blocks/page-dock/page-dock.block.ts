/**
 * Stackra file contract:
 * Purpose: `PageDockBlock`, the document side of the landing's dock (`./react`'s `PageDock`, on `@stackra/ui`'s
 *          `SectionDock`): its nav's name and the sections it links, each with the status line it narrates.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The items repeat the stations' ids and status lines, since a node never reads
 *           another node. The key is gen's `<member>.<snake(folder)>`, `experience.page_dock`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { DockItem } from "#core/types/dock-item.type";

/** The page dock a document places. */
export class PageDockBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.pageDock,
}) {
  /** The dock's nav name. */
  label!: LocalizedText;

  /** The sections the dock links, in page order. */
  items!: DockItem[];
}
