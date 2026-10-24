/**
 * Stackra file contract:
 * Purpose: type tests of the `PushTransport` `DriverRegistry` entry: `DriverName<PushTransport>` is exactly the
 *          package's four driver names.
 * Boundary: test only; types only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import "#core/types/push-transport-driver-names.type";
import type { DriverName } from "@stackra/container";
import { describe, expectTypeOf, it } from "@stackra/testing";

import type { PushTransport } from "#contracts/ports/push-transport.port";

describe("DriverRegistry: platform.PushTransport", () => {
  it("narrows DriverName<PushTransport> to the package's drivers", () => {
    expectTypeOf<DriverName<PushTransport>>().toEqualTypeOf<
      "memory" | "web" | "expo" | "self_hosted"
    >();
  });
});
