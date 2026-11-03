/**
 * Stackra file contract:
 * Purpose: `HeroMachineBlock`, the document side of the landing's hero (`./react`'s `HeroMachine`): the headline,
 *          its lede and actions, the machine (the action window piped into its surfaces), the engine drawing and its
 *          dither horizon.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The key is gen's `<member>.<snake(folder)>`, `experience.hero_machine`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { CopyLink } from "#core/schemas/copy-link.schema";
import type { DitherBand } from "#core/schemas/dither-band.schema";
import type { Drawing } from "#core/schemas/drawing.schema";
import type { LandingLink } from "#core/schemas/landing-link.schema";
import type { Machine } from "#core/schemas/machine.schema";

/** The hero a document places. */
export class HeroMachineBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.heroMachine,
}) {
  title!: LocalizedText;

  lede!: LocalizedText;

  primary!: LandingLink;

  copyLink?: CopyLink;

  command?: string;

  /** The engine drawing (`/art/engine`). */
  art!: Drawing;

  /** The dither horizon under the drawing. */
  horizon!: DitherBand;

  /** The action window and the surfaces it is piped into; the pipe draw-in is the page's one orchestrated motion. */
  machine?: Machine;
}
