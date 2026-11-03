/**
 * Stackra file contract:
 * Purpose: `HeroMachineBlock`, the document side of the landing's hero (`./react`'s `HeroMachineBlock`): the
 *          headline, its lede and actions, the engine drawing and its dither horizon.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The machine (the schematic) is the app's element, so no field. The key is derived
 *           by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import type { DitherPattern } from "@stackra/ui/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The hero a document places. */
export class HeroMachineBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.heroMachine,
}) {
  title!: LocalizedText;

  lede!: LocalizedText;

  primary!: { label: LocalizedText; href: string };

  copyLink?: { label: LocalizedText; value: string };

  command?: string;

  /** The engine SVG the page ships; decorative unless `alt` is given. */
  art!: { src: string; alt?: LocalizedText };

  /** The dither horizon: its poster, its pattern and the sun (the core glow) as fractions of its box, 0 to 1. */
  horizon!: { poster: string; pattern?: DitherPattern; sun?: { x: number; y: number } };
}
