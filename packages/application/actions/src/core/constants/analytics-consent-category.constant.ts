/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_CONSENT_CATEGORY`, the consent category a call's verified snapshot must grant before the
 *          pipeline writes its analytics event (`ConsentCategory.Analytics` of @stackra/consent, by its code).
 * Boundary: a constant: this package does not import @stackra/consent (which depends on it), so it names the code.
 * Runtime: isomorphic
 * Governing contract: ADR 0472 (decision 3: a server-side send runs only when `granted` includes its category).
 */

/** The category code server analytics needs. */
export const ANALYTICS_CONSENT_CATEGORY = "analytics";
