/**
 * Stackra file contract:
 * Purpose: `VersionRequest`, what `resolveVersion` reads to pick a request's dated version: the `Stackra-Version`
 *          header, the caller's pin, the service's supported dates, fallback and support window, and the request time.
 * Boundary: a type only. `supported`, `fallback` and `supportMonths` come from the service's own versioning config; the pin from the API
 *           key or OAuth app record, set when it was created.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (decisions 3 and 4); ADR 0268 (R13: first-party clients pin the newest version).
 */

/** The inputs of `resolveVersion`. */
export interface VersionRequest {
  /** The request's `Stackra-Version` header (`Headers.get` gives `null` when absent); it overrides the pin. */
  readonly header?: string | null | undefined;

  /** The `YYYY-MM-DD` version the caller's API key or OAuth app was pinned to. */
  readonly pin?: string | undefined;

  /** Every `YYYY-MM-DD` version the service serves. */
  readonly supported: readonly string[];

  /** The version of a caller with neither header nor pin; one of `supported`. */
  readonly fallback: string;

  /**
   * Calendar months an older version stays served after its successor ships; from the service's versioning config,
   * `VERSION_SUPPORT_MONTHS` (12) when left out.
   */
  readonly supportMonths?: number | undefined;

  /** The request time, read from the Clock port. */
  readonly now: Date;
}
