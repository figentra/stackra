/**
 * Stackra file contract:
 * Purpose: `NonInteractivePromptError`, a prompt with no default asked in a run that may not prompt (no terminal, CI,
 *          `--no-interaction` or `--json`). The run exits 2 and names the option that answers the prompt.
 * Boundary: a `UsageError`, so the kernel treats it as one.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-023.
 */
import { UsageError } from "#core/errors/usage.error";

/** A prompt that cannot be asked here. */
export class NonInteractivePromptError extends UsageError {
  /**
   * @param message - the prompt's question.
   * @param option - the option that answers it, when the command named one.
   */
  constructor(message: string, option?: string) {
    super(
      `Cannot ask "${message}" without a terminal`,
      option === undefined ? "Run it in a terminal" : `Pass --${option}`,
    );
    this.name = "NonInteractivePromptError";
  }
}
