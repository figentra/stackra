/**
 * Stackra file contract:
 * Purpose: `ConsoleMode`, what one run may do on the terminal, decided once: the colour depth, Unicode, prompts,
 *          JSON, quiet, verbose, animation and the width every component lays out to.
 * Boundary: a type only; every component reads this object and nothing else, so plain output is one code path.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-016, FR-020 to FR-023.
 */

/** The decided mode of one run. */
export interface ConsoleMode {
  /** Colour bits: 0 (none), 4 (16 colours), 8 (256) or 24 (true colour). */
  readonly depth: 0 | 4 | 8 | 24;

  /** How right-to-left text is written: as stored, or reordered and shaped for a terminal that cannot. */
  readonly bidi: "logical" | "visual";

  /** Box lines and symbols in Unicode; ASCII when false. */
  readonly unicode: boolean;

  /** Prompts are asked; when false a prompt takes its default or fails. */
  readonly interactive: boolean;

  /** One JSON document is written, and nothing else. */
  readonly json: boolean;

  /** Only errors are written. */
  readonly quiet: boolean;

  /** Errors carry their stack and causes. */
  readonly verbose: boolean;

  /** Standard output is a terminal and colour is on, so spinners animate and lines are redrawn. */
  readonly animate: boolean;

  /** Standard output is a terminal (the banner shows only there). */
  readonly tty: boolean;

  /** The width components lay out to: the terminal's, at most 100. */
  readonly columns: number;
}
