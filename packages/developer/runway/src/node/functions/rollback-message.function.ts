/**
 * Stackra file contract:
 * Purpose: `rollbackMessage(sha)`, the deployment message a `runway promote` records: the provider keeps it beside its
 *          own record of the deploy, so a rollback has its own record (runbooks/deploys).
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0170; STA-268.
 */

/**
 * The rollback message of `sha`.
 *
 * @example
 * rollbackMessage("0123abc"); // "rollback to 0123abc"
 */
export const rollbackMessage = (sha: string): string => `rollback to ${sha}`;
