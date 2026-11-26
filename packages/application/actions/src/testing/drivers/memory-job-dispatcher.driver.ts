/**
 * Stackra file contract:
 * Purpose: `MemoryJobDispatcherDriver`, the "memory" `JobDispatcher` a test picks with `.useDrivers("memory")`: it
 *          keeps every job an action queues (`jobs`, in order), so a test asserts what was queued without
 *          `@stackra/queue` and its store.
 * Boundary: test only. It records and runs nothing; a test that needs the job's effect runs the action itself.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0098 (the pipeline's queued call); os#256.
 */
import type { AnyClass } from "@stackra/container";
import { Driver } from "@stackra/container";

import { JobDispatcher } from "#contracts/index";
import type { CallDescriptor } from "#contracts/index";

/** Keeps each queued job. */
export class MemoryJobDispatcherDriver extends Driver(JobDispatcher) {
  /** The queued jobs, oldest first. */
  readonly jobs: {
    readonly action: AnyClass;
    readonly input: unknown;
    readonly call: CallDescriptor;
  }[] = [];

  /** Records the job; never runs it. */
  async dispatch(action: AnyClass, input: unknown, call: CallDescriptor): Promise<void> {
    this.jobs.push({ action, input, call });
  }
}
