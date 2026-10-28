/**
 * Stackra file contract:
 * Purpose: type tests of the `PlatformPushTransport` `DriverRegistry` entry: `DriverName<PlatformPushTransport>` is exactly the
 *          package's four driver names.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import "#core/types/push-transport-driver-names.type";
import type { DriverName } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";

describe("DriverRegistry: platform.PlatformPushTransport", () => {
  it("narrows DriverName<PlatformPushTransport> to the package's drivers", () => {
    expectTypeOf<DriverName<PlatformPushTransport>>().toEqualTypeOf<
      "memory" | "web" | "expo" | "self_hosted"
    >();
  });
});
