/**
 * Stackra file contract:
 * Purpose: `ReferrerPolicy`, one value of `CspConfig.referrerPolicy`.
 * Boundary: a type only, derived from `REFERRER_POLICIES`, so the type and the schema never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); owner round 3 #34.
 */
import type { REFERRER_POLICIES } from "#core/constants/referrer-policies.constant";

/** One allowed referrer policy. */
export type ReferrerPolicy = (typeof REFERRER_POLICIES)[number];
