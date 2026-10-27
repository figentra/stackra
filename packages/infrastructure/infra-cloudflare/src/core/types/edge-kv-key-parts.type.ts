/**
 * Stackra file contract:
 * Purpose: `EdgeKvKeyParts`, the parts of each key family of the edge Worker's KV copy, in key order.
 * Boundary: type only; `edgeKvKey` joins them.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 6).
 */

/** The parts of each key family, in key order. */
export type EdgeKvKeyParts = {
  /** The parts of a `host:<hostname>` key. */
  readonly host: readonly [hostname: string];
  /** The parts of a `boot:<product>:<surface>:<scope>` key. */
  readonly boot: readonly [product: string, surface: string, scope: string];
  /** The parts of a `shell:<surface>:<line>` key. */
  readonly shell: readonly [surface: string, line: string];
  /** The parts of a `release:<product>:<surface>` key. */
  readonly release: readonly [product: string, surface: string];
  /** The parts of a `canary:<product>:<surface>` key. */
  readonly canary: readonly [product: string, surface: string];
  /** The parts of a `wellknown:<hostname>:<file>` key. */
  readonly wellknown: readonly [hostname: string, file: string];
};
