/**
 * Stackra file contract:
 * Purpose: `IDEMPOTENT_METHODS`, the HTTP methods whose repeat has the effect of one call, so `retry` may send them
 *          again without an `Idempotency-Key`.
 * Boundary: internal; upper-case names. `POST` and `PATCH` are repeated only with a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (idempotency); the HTTP conventions rule (`PUT` and `DELETE` are idempotent).
 */
import { HttpMethod } from "@stackra/contracts";

import { SAFE_METHODS } from "#core/constants/safe-methods.constant";

/** The safe methods plus `PUT` and `DELETE`. */
export const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set([
  ...SAFE_METHODS,
  HttpMethod.Put,
  HttpMethod.Delete,
]);
