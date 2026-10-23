/**
 * Stackra file contract:
 * Purpose: the npm name of @stackra/{{NAME}}, for diagnostics and error sources. The `.` export names this file
 *          until gen writes the core barrel (ADR 0294 decision 15).
 * Boundary: one constant; no logic.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 13 and 15); ADR 0231 (naming).
 */

/** The npm name of this package. */
export const PACKAGE_NAME = "@stackra/{{NAME}}";
