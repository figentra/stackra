/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PushTransport` port: a port base keyed `platform.PushTransport` whose drivers
 *          are instances of it, with its permission and registration signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0255 (decision 3); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PushTransport } from "#contracts/ports/push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";

describe("PushTransport", () => {
  it("is a port its drivers are instances of", () => {
    const transport = new MemoryPushTransportDriver();
    expect(transport).toBeInstanceOf(PushTransport);
    expect(transport).toBeInstanceOf(Port);
  });

  it("is keyed platform.PushTransport and types its calls", () => {
    expectTypeOf<PushTransport["~key"]>().toEqualTypeOf<"platform.PushTransport">();
    expectTypeOf<PushTransport["permission"]>().returns.toEqualTypeOf<Promise<PermissionStatus>>();
    expectTypeOf<PushTransport["register"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<PushRegistration>>
    >();
  });
});
