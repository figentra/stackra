/**
 * Stackra file contract:
 * Purpose: `STACKRA_KINDS`: the exactly five kinds of item; a missing `stackra.kind` is `package`.
 * Boundary: a constant only.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */

/** The exactly five kinds of item; a missing `stackra.kind` is `package`. */
export const STACKRA_KINDS = ["package", "skill", "agent", "mcp", "plugin"] as const;
