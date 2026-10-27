/**
 * Stackra file contract:
 * Purpose: `Bytes`: bytes backed by a plain ArrayBuffer, the form Web Crypto and Blob accept.
 * Boundary: pure Web Crypto; no I/O.
 * Runtime: worker
 * Governing contract: ADR 0453 (decision 8).
 */

/** Bytes backed by a plain ArrayBuffer, the form Web Crypto and Blob accept. */
export type Bytes = Uint8Array<ArrayBuffer>;
