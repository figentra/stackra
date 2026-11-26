/**
 * Stackra file contract:
 * Purpose: `GcpOrgPolicy`, one organization policy on the organization or a folder: enforced (a boolean constraint)
 *          or a list of allowed or denied values.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0524 (the GCP organization).
 */

/** One organization policy. */
export interface GcpOrgPolicy {
  /** The constraint without `constraints/`, e.g. `iam.disableServiceAccountKeyCreation`. */
  readonly constraint: string;
  /** `org`, or a folder path (`workloads/ksa`). */
  readonly target: string;
  /** Whether a boolean constraint is enforced. */
  readonly enforce?: boolean;
  /** The values a list constraint allows. */
  readonly allowedValues?: readonly string[];
  /** The values a list constraint denies. */
  readonly deniedValues?: readonly string[];
}
