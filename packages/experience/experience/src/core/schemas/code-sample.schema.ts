/**
 * Stackra file contract:
 * Purpose: `CodeSample`, the code a step shows in a schematic frame: its file name, its language and its source.
 * Boundary: a shape class only, the field type of `SwitcherStep`; gen compiles it with the step switcher block. The
 *           code is shown as text, never run and never translated.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import { Schema } from "@stackra/validation";

/** A code sample. */
export class CodeSample extends Schema {
  filename!: string;

  /** The highlighter's language (`ts`, `json`, `yaml`). */
  language!: string;

  source!: string;
}
