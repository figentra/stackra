/**
 * Stackra file contract:
 * Purpose: `checkGitignore(text)`, that the repository's `.gitignore` ignores the generated `.stackra/` folder.
 * Boundary: pure; `text` is the root `.gitignore`, undefined when absent.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: gen writes tool configs into `.stackra/`).
 */

/** A `.gitignore` line that ignores `.stackra/` or everything in it, at the root (a leading slash) or in every member (a leading double star). */
const STACKRA_IGNORED = /^(?:\/|\*\*\/)?\.stackra(\/\*?)?[ \t]*$/m;

/**
 * The `.gitignore` finding, if any.
 *
 * @param text - the root `.gitignore`, or undefined when there is none.
 * @example
 * checkGitignore("node_modules\n.stackra/*\n"); // []
 */
export function checkGitignore(text: string | undefined): string[] {
  return STACKRA_IGNORED.test(text ?? "")
    ? []
    : [".gitignore: ignore the generated `.stackra/*` folder (ADR 0295)"];
}
