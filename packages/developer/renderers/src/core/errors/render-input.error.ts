/**
 * Stackra file contract:
 * Purpose: `RenderInputError`, thrown when a document set cannot be rendered for an assistant: a sub-agent names a tool
 *          the assistant's map has no entry for, or two documents would write the same path.
 * Boundary: a plain `Error`, not a refusal: a bad document set is an author's mistake, found before anything is
 *           written.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2 and enforcement).
 */

/**
 * A document set that cannot be rendered.
 *
 * @example
 * try {
 *   renderAssistant(Assistant.Kiro, documents);
 * } catch (error) {
 *   if (error instanceof RenderInputError) error.assistant; // "kiro"
 * }
 */
export class RenderInputError extends Error {
  /** The assistant code the render was for. */
  readonly assistant: string;

  /**
   * @param assistant - the assistant code.
   * @param message - what is wrong, naming the documents.
   */
  constructor(assistant: string, message: string) {
    super(`Cannot render for ${assistant}: ${message}`);
    this.name = "RenderInputError";
    this.assistant = assistant;
  }
}
