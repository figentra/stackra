/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/queue (the worker and the Postgres driver) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the worker opens a job's scope session through
 *           @stackra/database and the driver keeps jobs in Postgres. The job-table migration is found by its path, as
 *           every migration is, so it is not re-exported.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";
export { QueueWorkerService } from "#node/services/queue-worker.service";
