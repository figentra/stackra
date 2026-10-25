/**
 * Stackra file contract:
 * Purpose: type tests of the `DriverRegistry` entries: `DriverName<OutboxDriver>` and `DriverName<InboxDriver>` are the
 *          shipped driver names.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16).
 */
import "#core/types/outbox-driver-names.type";

import type { DriverName, DriverRegistry } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { InboxDriver } from "#contracts/ports/inbox-driver.port";
import type { OutboxDriver } from "#contracts/ports/outbox-driver.port";

describe("DriverRegistry['outbox.OutboxDriver'] and ['outbox.InboxDriver']", () => {
  it("narrows both driver names to the shipped drivers", () => {
    expectTypeOf<DriverName<OutboxDriver>>().toEqualTypeOf<"postgres" | "memory">();
    expectTypeOf<DriverName<InboxDriver>>().toEqualTypeOf<"postgres" | "memory">();
    expectTypeOf<DriverRegistry["outbox.OutboxDriver"]>().toEqualTypeOf<DriverName<OutboxDriver>>();
  });
});
