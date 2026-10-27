/**
 * Stackra file contract:
 * Purpose: `SearchConformanceOptions`, what a driver tells the `SearchDriver` conformance suite about itself.
 * Boundary: a type only, in the `./testing` entry. It only switches cases a driver is not held to; it never loosens a
 *           rule the port states for every engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5); ADR 0333 (amendment: an engine that cannot apply visibility refuses).
 */

/** How the suite treats the driver under test. */
export interface SearchConformanceOptions {
  /**
   * The driver applies `SearchRequest.visible` (a SQL engine). When absent or false the suite checks that a request
   * carrying it is refused rather than ranked; when true that case is skipped (the driver's own tests cover it).
   */
  readonly appliesVisibility?: boolean;
}
