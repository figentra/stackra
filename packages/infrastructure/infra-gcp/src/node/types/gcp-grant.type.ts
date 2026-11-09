/**
 * Stackra file contract:
 * Purpose: `GcpGrant`, one IAM member on the organization, a folder, a project or a billing account (non-authoritative:
 *          other members of the role are left alone).
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0524 (the GCP organization).
 */

/** One IAM grant: a role for a member on the organization, a folder, a project or a billing account. */
export interface GcpGrant {
  /** `org`, a folder path, `project:<id>` or `billing:<account id>`. */
  readonly target: string;
  /** The role to grant, e.g. `roles/viewer`. */
  readonly role: string;
  /** `user:…`, `group:…`, `serviceAccount:…`, `domain:…`. */
  readonly member: string;
}
