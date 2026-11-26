/**
 * Stackra file contract:
 * Purpose: `DATABASE_SETUP_SETTINGS`, the one-shot task that creates a Postgres resource's planned extensions before
 *          migrations: the pinned Postgres client image (Docker Hub, or the same path under the account's ECR
 *          pull-through cache when the runtime names one), its container name, Fargate size, how long the deploy
 *          waits for it and how often it looks, and how long its logs are kept when the options name no retention.
 * Boundary: data only; names and sizes, never a value. A new client version is a tag bump by pull request; the client
 *           only needs to speak the servers' protocol, which every supported major does.
 * Runtime: node
 * Governing contract: ADR 0160 (note of 2026-11-26, STA-2092), ADR 0444 (decision 4: Fargate), ADR 0173.
 */

/** The extensions task's facts. */
export const DATABASE_SETUP_SETTINGS = Object.freeze({
  /** The Postgres client image, pulled from Docker Hub (the infra-tools database task pins the same). */
  image: "postgres:18.6-alpine",
  /** The same image under the ECR pull-through prefix for Docker Hub (`docker-hub/`), when the runtime names one. */
  registryImage: "docker-hub/library/postgres:18.6-alpine",
  /** The container whose exit code decides the run. */
  container: "extensions",
  /** The smallest Fargate size: psql only. */
  cpu: "256",
  memoryMb: "512",
  /** How long the deploy waits before it stops the task and fails. */
  timeoutMinutes: 10,
  /** Seconds between two looks at the task. */
  pollSeconds: 10,
  /** Days its logs are kept when `workloads.logRetentionDays` is not set. */
  logDays: 30,
} as const);
