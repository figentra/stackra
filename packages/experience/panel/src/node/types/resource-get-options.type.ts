/**
 * Stackra file contract:
 * Purpose: `ResourceGetOptions`, what gen hands `ResourceGetQuery` for a resource whose `get` operation is `true`: the
 *          query key, the input field that carries the record's public id (`<model>Id`, the `GET /xs/:xId` route
 *          parameter) and the row's field names.
 * Boundary: a type only; static data gen writes.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 1); ADR 0294 (decision 21: the endpoint convention); STA-1971.
 */

/** The options of one generated get read. */
export interface ResourceGetOptions {
  /** The query key, `<model>.get`. */
  readonly key: string;

  /** The input field that carries the record's public id (`loyaltyAccountId`). */
  readonly idField: string;

  /** The row's field names, picked from the record; absent when the row is the model. */
  readonly fields?: readonly string[];
}
