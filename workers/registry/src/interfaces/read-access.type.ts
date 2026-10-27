/**
 * Stackra file contract:
 * Purpose: `ReadAccess`: the outcome of a read check.
 * Boundary: decides; reads the licence only through the `LicenceCheck` port.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 10 and 13).
 */
import type { LicenceView } from "#src/interfaces/licence-view.interface";

/** The outcome of a read check. */
export type ReadAccess =
  | { readonly allowed: true; readonly licence: LicenceView | null }
  | { readonly allowed: false; readonly status: 401 | 403; readonly reason: string };
