/**
 * Stackra file contract:
 * Purpose: `CodeSample`, the code a step shows in a schematic frame: its file name, its language and its source.
 * Boundary: a type only, the field type of `SwitcherStep`. The code is shown as text, never run and never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */

/** A code sample. */
export interface CodeSample {
  /** The file name the frame shows (`checkout.action.ts`). */
  readonly filename: string;

  /** The highlighter's language (`ts`, `json`, `yaml`). */
  readonly language: string;

  /** The code, shown as text. */
  readonly source: string;
}
