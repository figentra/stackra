/**
 * Stackra file contract:
 * Purpose: `SurfacesBlock`, the document side of the Draw station's surfaces (`./react`'s `Surfaces`): the group's
 *          spoken name and the frames the action's button is drawn in, web, desktop and phone.
 * Boundary: a block declaration only; its fields are the props a document may give it. The group's name is a
 *           `LocalizedText`; a surface's words are the drawn app's own, in its `lang`. The key is gen's
 *           `<member>.<snake(folder)>`, `experience.surfaces`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { Surface } from "#core/types/surface.type";

/** The surfaces a document places. */
export class SurfacesBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.surfaces,
}) {
  /** The group's spoken name. */
  label!: LocalizedText;

  /** The frames the action's button is drawn in, in order. */
  surfaces!: Surface[];
}
