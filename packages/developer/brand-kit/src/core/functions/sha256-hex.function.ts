/**
 * Stackra file contract:
 * Purpose: `sha256Hex`, the hex SHA-256 of some bytes: the hash the asset manifest and the input hash carry.
 * Boundary: pure apart from node:crypto.
 * Runtime: node
 * Governing contract: ADR 0441 (as amended: deterministic output).
 */
import { createHash } from "node:crypto";

/**
 * Hex SHA-256 of `bytes`.
 *
 * @example
 * const hash = sha256Hex(new TextEncoder().encode("kit"));
 */
export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}
