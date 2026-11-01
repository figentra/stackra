/**
 * Stackra file contract:
 * Purpose: `errorCode(error)`, the machine code of an error in a `--json` document: its class name without `Error`,
 *          in snake case (`NonInteractivePromptError` → `non_interactive_prompt`), as refusal codes are derived.
 * Boundary: pure; anything not an Error is `error`.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-022; ADR 0231 (snake_case machine codes).
 */

/** The snake-case code of `error`. */
export function errorCode(error: unknown): string {
  const name = error instanceof Error ? error.name.replace(/Error$/, "") : "";
  const code = name.replaceAll(/(?<=[a-z0-9])(?=[A-Z])/g, "_").toLowerCase();
  return code === "" ? "error" : code;
}
