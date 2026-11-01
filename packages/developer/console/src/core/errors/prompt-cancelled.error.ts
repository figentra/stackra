/**
 * Stackra file contract:
 * Purpose: `PromptCancelledError`, the Operator cancelled a prompt with Ctrl-C or Escape. The run exits 130.
 * Boundary: a plain `Error`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-025.
 */

/** A cancelled prompt. */
export class PromptCancelledError extends Error {
  /**
   * @param message - the prompt's question.
   */
  constructor(message: string) {
    super(`Cancelled: ${message}`);
    this.name = "PromptCancelledError";
  }
}
