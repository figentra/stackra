/**
 * Stackra file contract:
 * Purpose: `ConsolePrompt`, the typed questions a command asks: text, password, confirm, select, multiselect and
 *          search, each answered by the terminal, by its default in a non-interactive run, or by a test's script.
 * Boundary: a type only; `createPrompt` implements it.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023 and FR-024.
 */
import type { PromptRequest } from "#contracts/types/prompt-request.type";

/** The fields of a request other than its kind. */
type Ask = Omit<PromptRequest, "kind">;

/** The questions a command can ask. */
export interface ConsolePrompt {
  /** Free text. */
  readonly text: (request: Ask) => Promise<string>;

  /** Hidden text; no character is echoed. */
  readonly password: (request: Ask) => Promise<string>;

  /** Yes or no. */
  readonly confirm: (request: Ask) => Promise<boolean>;

  /** One of `choices`. */
  readonly select: (request: Ask) => Promise<string>;

  /** Any of `choices`. */
  readonly multiselect: (request: Ask) => Promise<string[]>;

  /** One of `choices`, filtered as the Operator types. */
  readonly search: (request: Ask) => Promise<string>;
}
