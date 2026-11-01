/**
 * Stackra file contract:
 * Purpose: `PromptAnswer`, what a prompter returns: a string, a boolean (`confirm`) or a list (`multiselect`).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */

/** The answer to one prompt. */
export type PromptAnswer = string | boolean | readonly string[];
