/**
 * Stackra file contract:
 * Purpose: `CompileReportOptions`, what `compileReport` needs from the driver: the path resolver, the call's time zone,
 *          the default page size and the row cap.
 * Boundary: a type only; the driver fills it from `ReportsConfig`, the running call and the source model's metadata.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3).
 */

/** What `compileReport` needs from its caller. */
export interface CompileReportOptions {
  /** The quoted, aliased column of a source path; joins a relation the path follows. */
  readonly column: (path: string) => string;

  /** The call's IANA time zone, which time grains bucket in. */
  readonly timeZone: string;

  /** The page size when the request names none. */
  readonly pageSize: number;

  /** The most groups one run reads: the cap of a page and of how far the cursor goes. */
  readonly maxRows: number;
}
