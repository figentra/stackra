/**
 * Stackra file contract:
 * Purpose: `DATABASE_SETUP_SETTINGS`, the Cloud Run job that creates the server's planned Postgres extensions before
 *          migrations: the admin user it signs in as, the pinned Postgres client image, the service account purpose
 *          (its id is `<deployment>-dbext`), where the Cloud SQL volume mounts, and how long one run may take.
 * Boundary: data only; names and sizes, never a value. A new client version is a tag bump by pull request; the client
 *           only needs to speak the server's protocol, which every supported major does.
 * Runtime: isomorphic
 * Governing contract: ADR 0160 (note of 2026-11-26, STA-2092), ADR 0238 (one admin login per server), ADR 0173.
 */

/** The extensions job's facts. */
export const DATABASE_SETUP_SETTINGS = Object.freeze({
  /** The built-in Cloud SQL user (a `cloudsqlsuperuser` member) the job signs in as; the AWS admin user's name too. */
  adminUser: "stackra_admin",
  /** The Postgres client image, from Docker Hub (the AWS task and the infra-tools database task pin the same tag). */
  image: "docker.io/library/postgres:18.6-alpine",
  /** The service account purpose: `<deployment>-dbext`, inside GCP's 30 characters wherever `-infra` fits. */
  accountPurpose: "dbext",
  /** Where the Cloud SQL volume puts the server's socket folder on a server without a private IP. */
  socketPath: "/cloudsql",
  /** The longest one run may take before Cloud Run stops it. */
  timeout: "600s",
} as const);
