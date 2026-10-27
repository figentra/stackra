/**
 * Stackra file contract:
 * Purpose: `R2Bucket`: the R2 bucket binding.
 * Boundary: types only. Each interface is a subset of the platform's; never add a member the Worker does not call.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3).
 */
import type { R2Body } from "#src/interfaces/r2-body.interface";
import type { R2Head } from "#src/interfaces/r2-head.interface";

/** The R2 bucket binding. */
export interface R2Bucket {
  head(key: string): Promise<R2Head | null>;
  get(key: string): Promise<R2Body | null>;
  put(
    key: string,
    value: Uint8Array | string,
    options?: { readonly customMetadata?: Record<string, string> },
  ): Promise<unknown>;
}
