/**
 * Stackra file contract:
 * Purpose: `EdgeKvKeyParts`, the parts of each key family of the edge Worker's KV copy, in key order.
 * Boundary: type only; `edgeKvKey` joins them.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decision 6).
 */

/** The parts of each key family, in key order. */
export type EdgeKvKeyParts = {
  readonly host: readonly [hostname: string];
  readonly boot: readonly [product: string, surface: string, scope: string];
  readonly shell: readonly [surface: string, line: string];
  readonly release: readonly [product: string, surface: string];
  readonly canary: readonly [product: string, surface: string];
  readonly wellknown: readonly [hostname: string, file: string];
};
