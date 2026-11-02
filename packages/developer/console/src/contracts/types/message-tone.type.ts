/**
 * Stackra file contract:
 * Purpose: `MessageTone`, the tone of a one-line message: info, success, warn or error.
 * Boundary: a type only; warn and error go to standard error.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-018; STA-1966 spec FR-002.
 */

/** The tones of a message line. */
export type MessageTone = "info" | "success" | "warn" | "error";
