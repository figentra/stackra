/**
 * Stackra file contract:
 * Purpose: `Count`, how a resource table counts its rows: `@stackra/database`'s enum, re-exported so a resource's
 *          `t.count(Count.Exact)` and the table read share one set of codes.
 * Boundary: a re-export; a table is estimated unless it says otherwise, and an estimated count past 10,000 shows
 *           capped ("10,000+").
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 12: estimated counts; the count lives in `@stackra/database`); ADR 0294
 *                     (decision 16: Enum); reporting gap 6.
 */
export { Count } from "@stackra/database";
