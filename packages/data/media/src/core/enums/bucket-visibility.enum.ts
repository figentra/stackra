/**
 * Stackra file contract:
 * Purpose: `BucketVisibility`, who may read a bucket's files: anyone through the CDN, or only a holder of a temporary
 *          URL.
 * Boundary: a closed set; a file's stored path starts with its bucket's visibility (`public/…`, `private/…`), so a CDN
 *           rule that serves only `public/` keeps private files unreadable.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (decision 3: public assets from a CDN bucket); ADR 0128 (`Enum.of`, no `enum`).
 */
import { Enum } from "@stackra/contracts";

/** Who reads a bucket's files. */
export const BucketVisibility = Enum.of({
  /** Served by the CDN at a stable URL (storefront images). */
  Public: "public",
  /** Read only through `MediaLibrary.temporaryUrl` (invoices, identity documents). */
  Private: "private",
});

/** One of the `BucketVisibility` codes. */
export type BucketVisibility = Enum.Value<typeof BucketVisibility>;
