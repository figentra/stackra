/**
 * Stackra file contract:
 * Purpose: `R2Body`: an R2 object with its body.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */
import type { R2Head } from "#src/interfaces/r2-head.interface";

/** An R2 object with its body. */
export interface R2Body extends R2Head {
  readonly body: ReadableStream<Uint8Array>;
}
