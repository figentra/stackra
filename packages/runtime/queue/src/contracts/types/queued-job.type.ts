/**
 * Stackra file contract:
 * Purpose: `QueuedJob`, one stored job as a `QueueDriver` keeps it: which action runs with which input, on which queue,
 *          for whom and in which scope, when it is due, how many attempts it has had and how its last one failed, and
 *          how it is scheduled fairly: its priority, the cap on running jobs of its scope, its throttle, its batch and
 *          the rest of its chain.
 * Boundary: a type only; `QueueService` builds it and a driver stores it as it is. The input is JSON-serialisable (the
 *           action's input fields), never a class instance. The origin is the verified caller whose call queued the job
 *           and the scope is the authenticated scope the job runs in, never request input.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1 and 2: priority, batches, chains, fair queues); ADR 0305 (rule 28: the job's name is the action's key); ADR 0098 (the
 *                     typed actor); ADR 0327 and ADR 0323 (a scope is a `ScopeRef`).
 */
import type { Actor, Duration, PublicId, ScopeRef } from "@stackra/contracts";

import type { JobStatus } from "#contracts/enums/job-status.enum";
import type { ChainedJob } from "#contracts/types/chained-job.type";
import type { JobError } from "#contracts/types/job-error.type";
import type { JobThrottle } from "#contracts/types/job-throttle.type";

/** A stored job. */
export interface QueuedJob {
  /** The job's public id (`job_…`). */
  readonly id: PublicId<"job">;

  /** The worker queue that runs it (`maintenance`). */
  readonly queue: string;

  /** The key of the action it runs (`messages.message.deliver@1`). */
  readonly key: string;

  /** The action's input. */
  readonly input: unknown;

  /** The caller whose call queued it; absent for a scheduled job. */
  readonly origin?: Actor;

  /** The scope it runs in; absent for a platform job. */
  readonly scope?: ScopeRef;

  /** The Idempotency-Key a queued call was sent with; every attempt runs under it. */
  readonly idempotencyKey?: string;

  /** Held while the job waits or runs, so a unique job is queued once per scope. */
  readonly uniqueKey?: string;

  /** The id of the call that queued it. */
  readonly causedBy?: string;

  /** Where the job is. */
  readonly status: JobStatus;

  /** Attempts started so far; a reservation counts one. */
  readonly attempts: number;

  /** When it is due. */
  readonly runAt: Date;

  /** How long a reservation holds before another worker may take the job again: its timeout and a grace minute. */
  readonly lease: Duration;

  /** How its last attempt failed. */
  readonly lastError?: JobError;

  /** Higher runs first among due jobs of a queue; `0` when absent. */
  readonly priority?: number;

  /** The most jobs of its queue and scope that run at once; no cap when absent. */
  readonly scopeConcurrency?: number;

  /** How often jobs sharing its throttle key may start. */
  readonly throttle?: JobThrottle;

  /** The batch it was queued in. */
  readonly batchId?: string;

  /** The links queued after it is done, in order. */
  readonly chain?: readonly ChainedJob[];
}
