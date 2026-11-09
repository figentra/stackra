/**
 * Stackra file contract:
 * Purpose: `ConsumerGatePackageJson`, the fields of a `package.json` the consumer gate reads.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The fields read. */
export type ConsumerGatePackageJson = {
  /** The package name. */
  readonly name?: string;

  /** The package scripts, by name. */
  readonly scripts?: Record<string, string>;
};
