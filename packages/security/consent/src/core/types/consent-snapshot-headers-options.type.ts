/**
 * Stackra file contract:
 * Purpose: `ConsentSnapshotHeadersOptions`, what `consentSnapshotHeaders` takes: where the consent endpoint is, how to
 *          build the request for a snapshot (the ledger's `snapshotRequest`), and the fetch and clock to use.
 * Boundary: a type only. `fetch` must not be a client whose session asks these headers (it would wait on itself), so
 *           the default is the platform's `fetch`.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 1).
 */
import type { ConsentSnapshotRequest } from "#contracts/types/consent-snapshot-request.type";

/** How a client gets its consent snapshot. */
export interface ConsentSnapshotHeadersOptions {
  /** The API origin the consent endpoint is under (`https://api.example.com`); a trailing slash is dropped. */
  readonly baseUrl: string;

  /** The request for a snapshot, asked on every call so a changed decision is fetched at once. */
  readonly snapshotRequest: () => ConsentSnapshotRequest;

  /** The fetch the endpoint is called with; the platform's when absent. */
  readonly fetch?: typeof globalThis.fetch;

  /** The clock in milliseconds since the epoch; `Date.now` when absent. */
  readonly now?: () => number;
}
