/**
 * Stackra file contract:
 * Purpose: `CONSUMER_GATE_DEFAULTS`, where a repository keeps the matrix and allow-list `stackra consumer-gate`
 *          reads when `--matrix` and `--allow` are not given, relative to the working directory.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The default data files. */
export const CONSUMER_GATE_DEFAULTS = {
  /** The products, their pins, services and overlays. */
  matrix: "tools/consumer-gate/matrix.yaml",
  /** The excused failures. */
  allow: "tools/consumer-gate/allow.yaml",
} as const;
