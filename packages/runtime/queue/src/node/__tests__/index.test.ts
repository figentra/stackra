/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the worker and the Postgres driver are its only values.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/queue/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual(["PostgresQueueDriver", "QueueWorkerService"]);
  });
});
