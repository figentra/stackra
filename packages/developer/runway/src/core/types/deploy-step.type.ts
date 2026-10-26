/**
 * Stackra file contract:
 * Purpose: `DeployStep`, one command a provider's plan runs: the program, its arguments and the folder it runs in.
 * Boundary: type only; a plan is a list of these, printed for review before `apply` runs the same list. No secret is
 *           ever an argument: credentials come from the job's environment (OIDC, the CLI's own login).
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decisions 3 and 6: plan before apply, the same in CI and a terminal).
 */

/** One command. */
export interface DeployStep {
  /** The program (`git`, `eas`). */
  readonly command: string;

  /** Its arguments. */
  readonly args: readonly string[];

  /** The folder it runs in, relative to the repository root; the root when absent. */
  readonly cwd?: string;
}
