/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the whole telemetry stack and its three parts are exported,
 *          nothing else is (`logArchive` stays internal), and none of `.`'s symbols is re-exported.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as observability from "#node/index";

describe("@stackra/infra-observability/node", () => {
  it("exports exactly its programs", () => {
    expect(Object.keys(observability).sort()).toEqual([
      "heartbeatMonitors",
      "logPipeline",
      "observabilityStack",
      "sentryProjects",
    ]);
  });
});
