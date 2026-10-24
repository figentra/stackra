/**
 * Stackra file contract:
 * Purpose: `SAFE_METHODS`, the HTTP methods that read only, so they take no `Idempotency-Key` (reads never take the
 *          header).
 * Boundary: internal; upper-case names, compared against `request.method.toUpperCase()` (the platform leaves
 *           `patch` as written).
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (idempotency); the HTTP conventions rule (methods by idempotency).
 */
import { HttpMethod } from "@stackra/contracts";

/** `GET`, `HEAD` and `OPTIONS`. */
export const SAFE_METHODS: ReadonlySet<string> = new Set([HttpMethod.Get, "HEAD", "OPTIONS"]);
