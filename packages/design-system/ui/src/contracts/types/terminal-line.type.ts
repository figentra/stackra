/**
 * Stackra file contract:
 * Purpose: `TerminalLine`, one line of a recorded terminal session that `TerminalDemo` plays: what kind of line it is
 *          and its text as the CLI printed it.
 * Boundary: types only. Lines are recorded from the real CLI (`tools/scripts/record-terminal-demo.mjs`), never written
 *           by hand, and never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-2041.
 */

/** One line of a recorded terminal session. */
export interface TerminalLine {
  /** `command` is typed by the user, `output` printed, `prompt` a question, `choice` an answer, `success` a done line. */
  readonly kind: "command" | "output" | "prompt" | "choice" | "success";
  /** The text, without the prompt sign or mark the kind draws. */
  readonly text: string;
}
