/**
 * Stackra file contract:
 * Purpose: `PageReadResult`, what `PageReader.read` returns: the page, or the refusal that stopped the read (with the
 *          site's status when it answered with an error).
 * Boundary: a type only. A refusal is a value, not a thrown error, so an agent tool can tell the merchant why a URL
 *           cannot be read; a programming error (a bad policy) still throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0450 (decision 1); STA-904 (page reader).
 */
import type { PageReadRefusal } from "#contracts/enums/page-read-refusal.enum";
import type { PageReading } from "#contracts/types/page-reading.type";

/** A page, or why there is none. */
export type PageReadResult =
  | { readonly ok: true; readonly page: PageReading }
  | { readonly ok: false; readonly refusal: PageReadRefusal; readonly status?: number };
