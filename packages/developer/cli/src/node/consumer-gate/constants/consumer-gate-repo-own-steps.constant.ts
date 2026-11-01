/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_REPO_OWN_STEPS`, the steps that judge the product's own repository, not its link to core:
 *          they run in the repo-own window (the checkout's own `pnpm-workspace.yaml` and `pnpm-lock.yaml` back in,
 *          the overlay-only service folders moved aside), as the hand-run `gate.sh` did.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The repo-own steps. */
export const CONSUMER_GATE_REPO_OWN_STEPS: readonly string[] = ["format", "spell", "validate"];
