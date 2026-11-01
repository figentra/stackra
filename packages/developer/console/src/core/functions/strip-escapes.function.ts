/**
 * Stackra file contract:
 * Purpose: `stripEscapes(text)`, the text without its terminal escape sequences (SGR colours, cursor moves, OSC).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-021 and FR-026.
 */

/** CSI and OSC sequences. */
// oxlint-disable-next-line no-control-regex -- reason: matching escape sequences is the point
const ESCAPES = /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007\u001B]*(?:\u0007|\u001B\\))/g;

/** `text` with every escape sequence removed. */
export function stripEscapes(text: string): string {
  return text.replaceAll(ESCAPES, "");
}
