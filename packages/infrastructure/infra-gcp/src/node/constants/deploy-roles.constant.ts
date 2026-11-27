/**
 * Stackra file contract:
 * Purpose: `DEPLOY_ROLES`, the predefined roles a deployment's infra service account holds on its project instead of
 *          `roles/owner`: one per kind of resource the infra-gcp programs manage (keys, buckets, service accounts and
 *          Workload Identity, Pub/Sub, Cloud Functions and Run, Cloud SQL, Secret Manager for the database admin
 *          password the extensions job reads), plus granting project IAM and acting as the service accounts it makes.
 *          A Cloud Run job on direct VPC egress needs no compute role here: the Cloud Run service agent uses the
 *          subnet (`roles/run.serviceAgent` holds `compute.subnetworks.use` in the same project).
 * Boundary: internal; `ciAccess` grants each. It follows the resources in this package, not a business choice, so a
 *           new resource kind adds its role here in the same change. `projectIamAdmin` can still grant roles: the
 *           deploy job is trusted only from its GitHub environment (ADR 0170 decision 6). The budget lives on the
 *           billing account, where the owner grants `roles/billing.costsManager` (an owner step).
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: least privilege), ADR 0354 (decision 3), ADR 0401 (narrower than owner),
 *                     ADR 0160 (note of 2026-11-26: the extensions job's secret).
 */

/** The infra service account's roles on its project. */
export const DEPLOY_ROLES = [
  "roles/cloudkms.admin",
  "roles/storage.admin",
  "roles/iam.serviceAccountAdmin",
  "roles/iam.serviceAccountUser",
  "roles/iam.workloadIdentityPoolAdmin",
  "roles/resourcemanager.projectIamAdmin",
  "roles/pubsub.admin",
  "roles/cloudfunctions.admin",
  "roles/run.admin",
  "roles/cloudsql.admin",
  "roles/secretmanager.admin",
  "roles/serviceusage.serviceUsageConsumer",
] as const;
