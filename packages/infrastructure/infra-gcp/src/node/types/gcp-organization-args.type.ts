/**
 * Stackra file contract:
 * Purpose: `GcpOrganizationArgs`, what `gcpOrganization` builds: folders as paths, organization policies, projects
 *          and grants.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0524 (the GCP organization).
 */

import type { GcpGrant } from "#node/types/gcp-grant.type";
import type { GcpOrgPolicy } from "#node/types/gcp-org-policy.type";
import type { GcpProject } from "#node/types/gcp-project.type";

/** The organization layer. */
export interface GcpOrganizationArgs {
  /** The numeric organization id. */
  readonly organizationId: string;
  /** Folder paths, parents first: `["workloads", "workloads/ksa"]`. */
  readonly folders: readonly string[];
  readonly policies: readonly GcpOrgPolicy[];
  readonly projects: readonly GcpProject[];
  readonly grants: readonly GcpGrant[];
}
