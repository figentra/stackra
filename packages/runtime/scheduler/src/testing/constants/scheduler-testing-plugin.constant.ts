/**
 * Stackra file contract:
 * Purpose: `SCHEDULER_TESTING_PLUGIN`, the testing-module plugin of @stackra/scheduler: on every `compile()` it makes
 *          that app's `SchedulerService` the one `tick` acts on.
 * Boundary: uses the app's own `SchedulerService`, so a tick pushes into the queue `drainQueue` of @stackra/queue
 *           drains; an app that binds none leaves no current scheduler. Registered when this module loads; each compile
 *           replaces the current scheduler. Adds no member to the app.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";

import { SchedulerService } from "#core/index";
import { CURRENT_SCHEDULER } from "#testing/constants/current-scheduler.constant";

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * await createTestingModule(OrdersModule).useDrivers("memory").compile();
 * await tick(new Date("2026-10-24T12:05:00Z"));
 */
export const SCHEDULER_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/scheduler",
  app(app: TestingApp) {
    CURRENT_SCHEDULER.value = app.has(SchedulerService) ? app.get(SchedulerService) : undefined;
    return {};
  },
};

registerTestingPlugin(SCHEDULER_TESTING_PLUGIN);
