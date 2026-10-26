/**
 * Stackra file contract:
 * Purpose: `CURRENT_PIPELINE`, the pipeline of the testing app compiled last, with the app, which `run(...)` uses.
 * Boundary: internal to `./testing`; set by the testing-module plugin on every compile, so each test module runs its
 *           calls on its own container.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { TestingApp } from "@stackra/container/testing";

import type { ActionPipeline } from "#core/index";
import type { RecordingAuditTrailDriver } from "#testing/drivers/recording-audit-trail.driver";

/** The last compiled testing app and its pipeline. */
export const CURRENT_PIPELINE: {
  value:
    | {
        readonly app: TestingApp;
        readonly pipeline: ActionPipeline;
        readonly trail: RecordingAuditTrailDriver;
      }
    | undefined;
} = { value: undefined };
