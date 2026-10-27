/**
 * Stackra file contract:
 * Purpose: `ProductPublishResult`, what a publish wrote: the object keys uploaded, the KV keys written, and each
 *          surface's release or canary, kept by the caller to judge the canary later.
 * Boundary: type only; `publishProduct` returns it.
 * Runtime: node
 * Governing contract: app-shells 4.2 and 5.3; owner decision D6.
 */
import type { EdgeCanary } from "#node/types/edge-canary.type";
import type { EdgeRelease } from "#node/types/edge-release.type";

/** The outcome of one publish. */
export type ProductPublishResult = {
  readonly product: string;
  /** Asset store keys, in upload order. */
  readonly uploaded: readonly string[];
  /** KV keys, in write order. */
  readonly written: readonly string[];
  /** Per surface key: the release written directly (first release). */
  readonly releases: Readonly<Record<string, EdgeRelease>>;
  /** Per surface key: the canary started. */
  readonly canaries: Readonly<Record<string, EdgeCanary<EdgeRelease>>>;
};
