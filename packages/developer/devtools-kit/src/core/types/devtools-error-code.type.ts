/**
 * Stackra file contract:
 * Purpose: `DevtoolsErrorCode`, the snake_case codes a `DevtoolsError` carries.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (machine codes are snake_case).
 */

/**
 * Why a devtools call failed: a malformed tab id, RPC name or channel (`invalid_name`), a second host
 * (`host_attached`), a session used after `detach` (`detached`), a tab the session cannot see (`unknown_tab`), or an
 * RPC no package defined (`unknown_rpc`).
 */
export type DevtoolsErrorCode =
  | "invalid_name"
  | "host_attached"
  | "detached"
  | "unknown_tab"
  | "unknown_rpc";
