/**
 * Stackra file contract:
 * Purpose: `RecordedLine`, one line of a recorded terminal session (`@stackra/ui`'s `TerminalLine`): what it is and
 *          its text.
 * Boundary: a type only, the field type of `TerminalStageBlock`. The text is the CLI's own, recorded by
 *           `tools/scripts/record-terminal-demo.mjs`, never written by hand or translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { TerminalLineKind } from "#core/enums/terminal-line-kind.enum";

/** A recorded terminal line. */
export interface RecordedLine {
  /** What the line is: a command, output, a prompt, the choice made or a done line. */
  readonly kind: TerminalLineKind;

  /** The text, without the prompt sign or mark the kind draws. */
  readonly text: string;
}
