/**
 * Stackra file contract:
 * Purpose: `ProvenanceVerdict`: the verdict of `checkProvenance`.
 * Boundary: no chain verification: Fulcio and Rekor are checked by consumers (`gh attestation verify`) and the
 *           release smoke job, as the ADR decides. shortcut: the identity is found as a byte string in the
 *           certificate DER rather than by parsing its SAN extension; upgrade to an X.509 parser if a client ever
 *           sends a certificate whose other fields could carry that URI.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 9).
 */

/** The verdict of `checkProvenance`. */
export type ProvenanceVerdict =
  | { readonly ok: true; readonly predicateType: string }
  | { readonly ok: false; readonly reason: string };
