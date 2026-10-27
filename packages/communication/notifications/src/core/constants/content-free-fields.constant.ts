/**
 * Stackra file contract:
 * Purpose: `CONTENT_FREE_FIELDS`, the only fields a content-free template may read: the record's kind and a link to
 *          it (`ContentFreeData`). Anything else is a field of the restricted record and is refused.
 * Boundary: the contract of the content-free variant, not a business value: the wording of each template stays data
 *           (lang files, studio overrides). An allowlist, so a new record field is refused until this changes.
 * Runtime: isomorphic
 * Governing contract: row "content-free templates for restricted records" of the package needs; ADR 0231; STA-964.
 */
import type { ContentFreeData } from "#contracts/types/content-free-data.type";

/** The fields a content-free template may read. */
export const CONTENT_FREE_FIELDS: readonly (keyof ContentFreeData)[] = Object.freeze([
  "kind",
  "link",
]);
