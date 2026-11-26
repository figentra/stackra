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
import type { CopyLink } from "#core/types/copy-link.type";
import type { DitherBand } from "#core/types/dither-band.type";
import type { Drawing } from "#core/types/drawing.type";
import type { LandingLink } from "#core/types/landing-link.type";
import type { Machine } from "#core/types/machine.type";

/** The hero a document places. */
export class HeroMachineBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.heroMachine,
}) {
  /** The headline, the page's `h1`. */
  title!: LocalizedText;

  /** The paragraph under the headline. */
  lede!: LocalizedText;

  /** The hero's one primary link. */
  primary!: LandingLink;

  /** A button that copies a value, such as the llms.txt URL. */
  copyLink?: CopyLink;

  /** A command shown as a chip, copied on press. */
  command?: string;

  /** The engine drawing (`/art/engine`). */
  art!: Drawing;

  /** The dither horizon under the drawing. */
  horizon!: DitherBand;

  /** The action window and the surfaces it is piped into; the pipe draw-in is the page's one orchestrated motion. */
  machine?: Machine;
}
