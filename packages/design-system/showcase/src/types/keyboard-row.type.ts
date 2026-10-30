/**
 * Stackra file contract:
 * Purpose: `KeyboardRow`, one row of a component's Keyboard panel: the keys (code names, never translated) and the
 *          action they perform, a key into `showcase::doc.key_action.<action>`.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */

/** One keyboard interaction of a component. */
export interface KeyboardRow {
  /** The keys, pressed together or as alternatives: ["Space", "Enter"]. Shown in `<kbd>`, left to right. */
  readonly keys: readonly string[];
  /** The action id; its words are `showcase::doc.key_action.<action>`. */
  readonly action: string;
}
