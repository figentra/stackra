/**
 * Stackra file contract:
 * Purpose: `DevtoolsRpcHandler`, a function a host calls by name through its session (`container.explain`,
 *          `cache.flush`).
 * Boundary: a type only. Its arguments come from the host, so a handler checks them before use.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 4).
 */

/** An RPC function; its arguments are untrusted host input. */
export type DevtoolsRpcHandler = (...args: readonly unknown[]) => unknown;
