/**
 * Stackra file contract:
 * Purpose: `NoteTone`, the tone of a boxed note: information, a warning or an alert.
 * Boundary: a type only; the tone picks the edge colour and the title.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018.
 */

/** The tones of `output.note`. */
export type NoteTone = "info" | "warning" | "alert";
