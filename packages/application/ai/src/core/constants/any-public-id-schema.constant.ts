/**
 * Stackra file contract:
 * Purpose: `ANY_PUBLIC_ID_SCHEMA`, the zod schema of a public id of any prefix: 2 to 6 letters, an underscore and 26
 *          Crockford base32 characters.
 * Boundary: internal, shared by the page context schemas; checks the format only (ADR 0135), never that the record
 *           exists or that the caller may read it. The stand-in for what gen writes for a bare `PublicId` field.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public id format); ADR 0294 (decision 26: a bare `PublicId` is any prefix); ADR 0490
 *                     (decision 5).
 */
import { z } from "zod";

/** The shipped schema of a `PublicId` with no prefix named. */
export const ANY_PUBLIC_ID_SCHEMA = z.string().regex(/^[a-z]{2,6}_[0-9a-hjkmnp-tv-z]{26}$/i);
