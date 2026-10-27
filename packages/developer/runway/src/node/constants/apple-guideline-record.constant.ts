/**
 * Stackra file contract:
 * Purpose: `APPLE_GUIDELINE_RECORD`, the file in a mobile app's `store` folder that records the owner's Apple
 *          guideline checks (`{ "4.2.6": { "result": "pass", "checkedAt": "…", "by": "…", "note": "…" }, "4.3": … }`).
 * Boundary: a constant only; `runMobileJob` reads the file before a white-label build under the platform's Apple
 *           account. The results are data, never code.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 8 and enforcement); app-shells D14 and section 15 point 10.
 */

/** The record file, relative to the app's `store` folder. */
export const APPLE_GUIDELINE_RECORD = "apple-guidelines.json";
