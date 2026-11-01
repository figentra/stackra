/**
 * Stackra file contract:
 * Purpose: `PromptKey`, one key press as `node:readline` reports it: its name, the text it types, and Ctrl.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024 and FR-025.
 */

/** A key press. */
export interface PromptKey {
  /** `return`, `escape`, `backspace`, `up`, `down`, `space`, `tab`, `c` with `ctrl`, ... */
  readonly name?: string;

  /** The text the key types. */
  readonly sequence?: string;

  /** Ctrl was held. */
  readonly ctrl?: boolean;
}
