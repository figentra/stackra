/**
 * Stackra file contract:
 * Purpose: the Apple App Review guidelines a white-label build under the platform's Apple account waits on: 4.2.6
 *          (apps made from a commercialised template for clients) and 4.3 (spam: many near-identical apps under one
 *          account). `APPLE_GUIDELINE_RECORD` names the file that records each result.
 * Boundary: constants only; `runMobileJob` reads the record. The result of a check is the owner's, recorded as data
 *           (`{ "4.2.6": { "result": "pass", "checkedAt": "…", "by": "…", "note": "…" }, … }`), never code.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8 and enforcement); app-shells D14 and section 15 point 10.
 */

/** The guidelines checked before the first white-label build under the platform's Apple account. */
export const APPLE_GUIDELINE_CHECKS = ["4.2.6", "4.3"] as const;
