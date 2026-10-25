/**
 * Stackra file contract:
 * Purpose: `SEGMENTS_TESTING_PLUGIN`, the testing-module plugin of @stackra/segments: on every `compile()` it connects
 *          that app's `SegmentService` to the app, so a test's segments read its registered subject classes.
 * Boundary: an app that binds no `SegmentService` is left as it is. Registered when this module loads; each compile
 *           connects its own app. Adds no member to the app.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0263 (decision 12).
 */
import { registerTestingPlugin } from "@stackra/container/testing";
import type { TestingApp, TestingPlugin } from "@stackra/container/testing";

import { SegmentService } from "#node/index";

/**
 * The plugin; registered with the testing module when this module loads.
 *
 * @example
 * import "@stackra/segments/testing";
 *
 * const app = await createTestingModule(CustomersModule).useDrivers("memory").compile();
 * await app.get(SegmentService).recompute(segment.id);
 */
export const SEGMENTS_TESTING_PLUGIN: TestingPlugin = {
  name: "@stackra/segments",
  app(app: TestingApp) {
    if (app.has(SegmentService)) app.get(SegmentService).connect(app);
    return {};
  },
};

registerTestingPlugin(SEGMENTS_TESTING_PLUGIN);
