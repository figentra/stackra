/**
 * Stackra file contract:
 * Purpose: `GcpGrant`, one IAM member on the organization, a folder, a project or a billing account (non-authoritative:
 *          other members of the role are left alone).
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0524 (the GCP organization).
 */

/** One grant. */
export interface GcpGrant {
  /** `org`, a folder path, `project:<id>` or `billing:<account id>`. */
  readonly target: string;
  readonly role: string;
  /** `user:…`, `group:…`, `serviceAccount:…`, `domain:…`. */
  readonly member: string;
}
