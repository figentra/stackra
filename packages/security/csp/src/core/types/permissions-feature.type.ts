/**
 * Stackra file contract:
 * Purpose: `PermissionsFeature`, one browser feature of the permissions-policy baseline, the key of
 *          `CspConfig.permissionsAllow`.
 * Boundary: a type only, derived from `PERMISSIONS_POLICY_BASELINE`, so the type and the schema never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); owner round 3 #34.
 */
import type { PERMISSIONS_POLICY_BASELINE } from "#core/constants/permissions-policy-baseline.constant";

/** One baseline feature. */
export type PermissionsFeature = (typeof PERMISSIONS_POLICY_BASELINE)[number];
