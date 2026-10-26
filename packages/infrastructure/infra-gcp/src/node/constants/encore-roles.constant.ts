/**
 * Stackra file contract:
 * Purpose: `ENCORE_ROLES`, the predefined roles the Encore Cloud service account holds on a project whose services
 *          deploy to `encore-cloud`, instead of the `roles/owner` Encore's connect flow asks for: one per kind of
 *          resource Encore provisions for an app (Cloud Run, Cloud SQL, Pub/Sub, buckets, Memorystore, secrets, cron
 *          jobs, the VPC with its connector and private services access, images), plus the service accounts its
 *          services run as, their project IAM, enabling APIs, and reading logs and metrics for its dashboard.
 * Boundary: internal; `encoreAccess` grants each. It follows what Encore provisions, not a business choice, so an
 *           Encore primitive that needs another resource kind adds its role here in the same change. A role Encore
 *           lacks fails its provisioning visibly in the Encore dashboard; it never widens to owner silently.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: least privilege), ADR 0289 (decision 5: Encore Cloud), ADR 0401 (narrower
 *                     than owner), ADR 0435 (decision 1).
 */

/** The Encore Cloud service account's roles on its project. */
export const ENCORE_ROLES = [
  "roles/run.admin",
  "roles/cloudsql.admin",
  "roles/pubsub.admin",
  "roles/storage.admin",
  "roles/redis.admin",
  "roles/secretmanager.admin",
  "roles/cloudscheduler.admin",
  "roles/compute.networkAdmin",
  "roles/vpcaccess.admin",
  "roles/servicenetworking.networksAdmin",
  "roles/artifactregistry.admin",
  "roles/iam.serviceAccountAdmin",
  "roles/iam.serviceAccountUser",
  "roles/resourcemanager.projectIamAdmin",
  "roles/serviceusage.serviceUsageAdmin",
  "roles/logging.viewer",
  "roles/monitoring.viewer",
] as const;
