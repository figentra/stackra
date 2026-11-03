/**
 * Stackra file contract:
 * Purpose: `RecordedLine`, one line of a recorded terminal session (`@stackra/ui`'s `TerminalLine`): what it is and
 *          its text.
 * Boundary: a shape class only, the field type of `TerminalStageBlock`; gen compiles it with the block. The text is
 *           the CLI's own, recorded by `tools/scripts/record-terminal-demo.mjs`, never written by hand or translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

import type { TerminalLineKind } from "#core/enums/terminal-line-kind.enum";

/** A recorded terminal line. */
export class RecordedLine extends Schema {
  kind!: TerminalLineKind;

  /** The text, without the prompt sign or mark the kind draws. */
  text!: string;
}
