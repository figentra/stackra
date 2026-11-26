/**
 * Stackra file contract:
 * Purpose: `OrganizationLayoutArgs`, what `organizationLayout` builds: the trusted services, the policy types, the
 *          centralized root features, the organizational units as paths, and the policies with their targets.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172, ADR 0524.
 */

import type { OrganizationPolicy } from "#node/types/organization-policy.type";

/** The organization layout to declare: trusted services, policy types, root access, units and policies. */
export interface OrganizationLayoutArgs {
  /** Trusted access, e.g. `sso.amazonaws.com`, `account.amazonaws.com`. */
  readonly servicePrincipals: readonly string[];
  /** The policy types enabled at the root. */
  readonly policyTypes: readonly string[];
  /** Centralized root access: `RootCredentialsManagement`, `RootSessions`. */
  readonly rootFeatures?: readonly string[];
  /** Unit paths, parents first: `["Workloads", "Workloads/me"]`. */
  readonly units: readonly string[];
  /** Policies by name. */
  readonly policies: Readonly<Record<string, OrganizationPolicy>>;
}
