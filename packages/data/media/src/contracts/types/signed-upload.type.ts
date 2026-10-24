/**
 * Stackra file contract:
 * Purpose: `SignedUpload`, what `MediaDisk.signUpload` returns: the URL a client puts the file's bytes to, and the
 *          headers it must send with them.
 * Boundary: a type only. The headers are part of the signature (the media type and the metadata), so a client that
 *           drops or changes one is refused by the store.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: presigned uploads, services never stream the bytes); ADR 0294 (decision
 *                     15).
 */

/** Where and how a client uploads one file. */
export interface SignedUpload {
  /** The signed URL. */
  readonly url: string;

  /** Always `PUT`: one request carries the whole file. */
  readonly method: "PUT";

  /** The headers to send exactly as given. */
  readonly headers: Readonly<Record<string, string>>;
}
