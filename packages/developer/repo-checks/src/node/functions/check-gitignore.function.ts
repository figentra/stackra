/**
 * Stackra file contract:
 * Purpose: `checkGitignore(text, services)`, that the repository's `.gitignore` ignores the generated `.stackra/` folder
 *          and, when it has services, the `encore.app` gen writes at each service's root (ADR 0091, amendment of
 *          2026-11-09).
 * Boundary: pure; `text` is the root `.gitignore`, undefined when absent.
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5: gen writes tool configs into `.stackra/`); ADR 0091 (decision 2, amended).
 */

/** A `.gitignore` line that ignores `.stackra/` or everything in it, at the root (a leading slash) or in every member (a leading double star). */
const STACKRA_IGNORED = /^(?:\/|\*\*\/)?\.stackra(\/\*?)?[ \t]*$/m;

/** A line that ignores a member's root `encore.app`: bare, in every member, or in every service. */
const ENCORE_APP_IGNORED = /^(?:\/?services\/\*\/|\*\*\/)?encore\.app[ \t]*$/m;

/**
 * The `.gitignore` findings, if any.
 *
 * @param text - the root `.gitignore`, or undefined when there is none.
 * @param services - whether the repository has service members.
 * @example
 * checkGitignore("node_modules\n.stackra/*\n"); // []
 */
export function checkGitignore(text: string | undefined, services = false): string[] {
  return [
    ...(STACKRA_IGNORED.test(text ?? "")
      ? []
      : [".gitignore: ignore the generated `.stackra/*` folder (ADR 0295)"]),
    ...(!services || ENCORE_APP_IGNORED.test(text ?? "")
      ? []
      : [
          ".gitignore: ignore `services/*/encore.app`, which gen writes at each service's root (ADR 0091)",
        ]),
  ];
}
