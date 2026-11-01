/**
 * Stackra file contract:
 * Purpose: `MemoryText`, a writable text stream that keeps what was written.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027.
 */
import type { WritableText } from "#contracts/types/writable-text.type";

/** A stream into memory. */
export interface MemoryText extends WritableText {
  /** Everything written so far. */
  readonly text: () => string;
}
