/**
 * Stackra file contract:
 * Purpose: `ConsumerGateCorePack`, one publishable core package: name, version and folder.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** One publishable package of the core tree. */
export type ConsumerGateCorePack = {
  /** The package name, `@stackra/<name>`. */
  readonly name: string;

  /** The version its `package.json` declares. */
  readonly version: string;

  /** The package folder, where it is packed from. */
  readonly dir: string;
};
