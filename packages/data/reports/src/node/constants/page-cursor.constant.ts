/**
 * Stackra file contract:
 * Purpose: `PAGE_CURSOR`, the opaque cursor of a report page: the number of groups before the next page, written as
 *          base64url so callers treat it as a token.
 * Boundary: internal. Grouped rows have no stable key to seek from (a sort may be on a measure), so a page is an
 *           offset into the ordered groups; the row cap bounds how far it goes. `decode` returns undefined for anything
 *           it did not write.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3: cursor in `ReportRequest`/`ReportResult`).
 */

/** The text inside the base64url. */
const FORM = /^o:(\d{1,9})$/;

/** Writes and reads report page cursors. */
export const PAGE_CURSOR = Object.freeze({
  /** The cursor of the page that starts after `offset` groups. */
  encode: (offset: number): string => Buffer.from(`o:${offset}`, "utf8").toString("base64url"),

  /** The offset `cursor` names, or undefined when it is not a report cursor. */
  decode: (cursor: string): number | undefined => {
    const match = FORM.exec(Buffer.from(cursor, "base64url").toString("utf8"));
    return match === null ? undefined : Number(match[1]);
  },
});
