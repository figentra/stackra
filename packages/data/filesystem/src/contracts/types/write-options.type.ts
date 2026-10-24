/**
 * Stackra file contract:
 * Purpose: `WriteOptions`, what `FileSystem.write` takes besides the key and the bytes.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0294 (decision 15: types live in the contracts leaf).
 */

/** How a file is stored. */
export interface WriteOptions {
  /** The media type served with the file (`application/pdf`); a bucket disk stores it, the local disk ignores it. */
  readonly contentType?: string;
}
