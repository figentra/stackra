/**
 * Stackra file contract:
 * Purpose: `SignedUpload`, what `FileSystem.signUpload` returns: the URL a client puts one file's bytes to, and the
 *          headers it must send with them.
 * Boundary: a type only. Where the store signs a header (the media type on S3, R2 and GCS), a client that drops or
 *           changes it is refused by the store. Moved here from @stackra/media's `MediaDisk` (stackra-226).
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 2: presigned uploads, services never stream the bytes); ADR 0234 (decision
 *                     7: one storage API); ADR 0294 (decision 15).
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
