/**
 * Stackra file contract:
 * Purpose: `Knob`, one live control of the optional knobs playground (WP11): a prop and the control that edits it.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 10; ADR 0305 (one declaration per file).
 */

/** One knob of an example's playground. */
export interface Knob {
  /** The prop name the knob edits. */
  readonly prop: string;
  /** The control: an enum is a select, a boolean a switch, a string a text field, an optional `value` a number. */
  readonly control: "select" | "switch" | "text" | "number";
}
