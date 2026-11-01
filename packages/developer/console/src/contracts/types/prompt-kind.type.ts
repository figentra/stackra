/**
 * Stackra file contract:
 * Purpose: `PromptKind`, how a prompt is asked: free text, hidden text, yes or no, one choice, several choices, or
 *          one choice found by typing.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-024.
 */

/** The kinds of prompt. */
export type PromptKind = "text" | "password" | "confirm" | "select" | "multiselect" | "search";
