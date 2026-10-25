/**
 * Stackra file contract:
 * Purpose: `CURRENT_QUEUE`, the queue service and the connected worker of the testing app compiled last, which
 *          `drainQueue` and `runJob` use.
 * Boundary: internal to `./testing`; set by the testing-module plugin on every compile, so each test module drains its
 *           own container's queue.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { QueueService } from "#core/index";
import type { QueueWorkerService } from "#node/index";

/** The last compiled testing app's queue. */
export const CURRENT_QUEUE: {
  value: { readonly queue: QueueService; readonly worker: QueueWorkerService } | undefined;
} = { value: undefined };
