/**
 * Stackra file contract:
 * Purpose: `TerminalStageBlock`, the document side of the landing's try-it terminal (`./react`'s `TerminalStage`):
 *          the command, the recorded session, the dither band it plays on and the monitor it ends on.
 * Boundary: a block declaration only; its fields are the props a document may give it, each word a `LocalizedText`
 *           the renderer resolves. The command and the recording are the CLI's own text, never translated; with no
 *           lines the component draws the command bar and the monitor, and no log. The result is the app's element,
 *           so no field. The key is gen's `<member>.<snake(folder)>`, `experience.terminal_stage`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0305 (rule 2); ADR 0504 (module UI kits); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import { Block } from "#core/bases/block.base";
import { LANDING_BLOCK_ICONS } from "#core/constants/landing-block-icons.constant";
import { BlockCategory } from "#core/enums/block-category.enum";
import type { DitherBand } from "#core/types/dither-band.type";
import type { Drawing } from "#core/types/drawing.type";
import type { RecordedLine } from "#core/types/recorded-line.type";

/** The try-it terminal a document places. */
export class TerminalStageBlock extends Block({
  category: BlockCategory.Marketing,
  icon: LANDING_BLOCK_ICONS.terminalStage,
}) {
  /** The command the session runs, shown and copied. */
  command!: string;

  /** The recorded session; empty until the command ships. */
  lines!: RecordedLine[];

  /** The terminal's spoken name. */
  label?: LocalizedText;

  /** The dither band the terminal plays on. */
  art?: DitherBand;

  /** The monitor drawing (`/art/monitor`), shown once the session has played. */
  monitor?: Drawing;
}
