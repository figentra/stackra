/**
 * Stackra file contract:
 * Purpose: `TerminalDemoBlock`, the document side of the landing's try-it terminal (`./react`'s `TerminalDemoBlock`):
 *          the command, the recorded session and the dither band it plays on.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The command and the recording are the CLI's own text, never translated. The result
 *           is the app's element, so no field. The key is derived by gen.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import type { DitherPattern, TerminalLine } from "@stackra/ui/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";

/** The try-it terminal a document places. */
export class TerminalDemoBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.terminalDemo,
}) {
  command!: string;

  lines!: TerminalLine[];

  label?: LocalizedText;

  art?: { poster: string; pattern?: DitherPattern };
}
