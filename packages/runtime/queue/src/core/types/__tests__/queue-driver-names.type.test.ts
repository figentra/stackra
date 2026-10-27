/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entry `queue.QueueDriver`: `DriverName<QueueDriver>` is exactly the
 *          shipped driver names.
 * Boundary: test only; types checked by vitest's `expectTypeOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import "#core/types/queue-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { QueueDriver } from "#contracts/ports/queue-driver.port";

describe("DriverRegistry['queue.QueueDriver']", () => {
  it("narrows DriverName<QueueDriver> to the shipped drivers", () => {
    expectTypeOf<DriverName<QueueDriver>>().toEqualTypeOf<"postgres" | "memory" | "broker">();
    expectTypeOf<DriverRegistry["queue.QueueDriver"]>().toEqualTypeOf<DriverName<QueueDriver>>();
  });
});
