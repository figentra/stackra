/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_INSTALL_FLAGS`, the `pnpm` arguments a linked product is installed with: a linked core has
 *          no registry provenance, so the lockfile is not frozen and the trust policy is off.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The install arguments, after `pnpm`. */
export const CONSUMER_GATE_INSTALL_FLAGS: readonly string[] = [
  "install",
  "--no-frozen-lockfile",
  "--config.trust-policy=off",
  "--config.strict-dep-builds=false",
];
