/**
 * Stackra file contract:
 * Purpose: `QUEUE_TESTING_PLUGIN`, the testing-module plugin of @stackra/queue: on every `compile()` it connects a
 *          worker to the app's pipeline and makes that app's queue the one `drainQueue` and `runJob` act on.
 * Boundary: uses the app's own `QueueDriver`, `QueueService` and `QueueWorkerService` when it binds them (so a job that
 *           `ctx.dispatch` stored is the one drained), else a memory driver and services on the app's clock. Registered
 *           when this module loads; each compile replaces the current queue. Adds no member to the app.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12); the STA-348 registry row (builder extension point).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";
import { Clock } from "@stackra/contracts";

import { QueueDriver } from "#contracts/index";
import { MemoryQueueDriver, QueueService } from "#core/index";
import { QueueWorkerService } from "#node/index";
import { CURRENT_QUEUE } from "#testing/constants/current-queue.constant";

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * await createTestingModule(NotificationsModule).useDrivers("memory").compile();
 * await drainQueue();
 */
export const QUEUE_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/queue",
  app(app: TestingApp) {
    const clock = app.get(Clock);
    const driver = app.has(QueueDriver) ? app.get(QueueDriver) : new MemoryQueueDriver();
    const queue = app.has(QueueService) ? app.get(QueueService) : new QueueService(driver, clock);
    const worker = app.has(QueueWorkerService)
      ? app.get(QueueWorkerService)
      : new QueueWorkerService(driver, clock);
    worker.connect(app);
    CURRENT_QUEUE.value = { queue, worker };
    return {};
  },
};

registerTestingPlugin(QUEUE_TESTING_PLUGIN);
