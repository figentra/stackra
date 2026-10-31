/**
 * Stackra file contract:
 * Purpose: `memoryText()`, a stream into memory for a test to read back.
 * Boundary: no I/O.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027.
 */
import type { MemoryText } from "#testing/types/memory-text.type";

/** A new memory stream. */
export function memoryText(): MemoryText {
  const chunks: string[] = [];
  return {
    write: (text) => {
      chunks.push(text);
    },
    text: () => chunks.join(""),
  };
}
