/**
 * Stackra file contract:
 * Purpose: `StationBlock`, the document side of a station on the landing's pipe (`./react`'s `StationBlock`): its
 *          anchor, title and line, and the dock's status line for it.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The schematic window is the app's element, so no field. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The station a document places. */
export class StationBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.station,
}) {
  /** The section id the dock links to (`expose`). */
  id!: string;

  title!: LocalizedText;

  body!: LocalizedText;

  status?: LocalizedText;
}
