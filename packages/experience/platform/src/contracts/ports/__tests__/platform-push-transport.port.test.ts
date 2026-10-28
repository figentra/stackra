/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PlatformPushTransport` port: a port base keyed `platform.PlatformPushTransport` whose drivers
 *          are instances of it, with its permission and registration signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0255 (decision 3); ADR 0294 (decision 16);
 *                     STA-1383 (package-qualified: notifications owns PushTransport, the server send).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
import type { CapabilityResult } from "#contracts/types/capability-result.type";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import type { PushRegistration } from "#contracts/types/push-registration.type";
import { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";

describe("PlatformPushTransport", () => {
  it("is a port its drivers are instances of", () => {
    const transport = new MemoryPushTransportDriver();
    expect(transport).toBeInstanceOf(PlatformPushTransport);
    expect(transport).toBeInstanceOf(Port);
  });

  it("is keyed platform.PlatformPushTransport and types its calls", () => {
    expectTypeOf<PlatformPushTransport["~key"]>().toEqualTypeOf<"platform.PlatformPushTransport">();
    expectTypeOf<PlatformPushTransport["permission"]>().returns.toEqualTypeOf<
      Promise<PermissionStatus>
    >();
    expectTypeOf<PlatformPushTransport["register"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<PushRegistration>>
    >();
  });
});
