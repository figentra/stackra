/**
 * Stackra file contract:
 * Purpose: `ConsumerGateCorePack`, one publishable core package: name, version and folder.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** One publishable package of the core tree. */
export type ConsumerGateCorePack = {
  readonly name: string;
  readonly version: string;
  readonly dir: string;
};
