/**
 * Stackra file contract:
 * Purpose: unit tests of `LOCKING_CONFIG_SCHEMA`: the full default from `{}`, the driver names closed to the shipped
 *          drivers, and the generated host form `Base$.extend(...)`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { LOCKING_CONFIG_SCHEMA } from "#core/constants/locking-config-schema.constant";

describe("LOCKING_CONFIG_SCHEMA", () => {
  it("parses {} to the default", () => {
    expect(LOCKING_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "postgres",
      valkeyUrl: "",
      valkey: { keyPrefix: "lock:" },
    });
  });

  it("takes the shipped drivers and refuses others", () => {
    expect(LOCKING_CONFIG_SCHEMA.parse({ driver: "memory" }).driver).toBe("memory");
    expect(LOCKING_CONFIG_SCHEMA.parse({ driver: "valkey" }).driver).toBe("valkey");
    expect(LOCKING_CONFIG_SCHEMA.safeParse({ driver: "redis" }).success).toBe(false);
  });

  it("is extended by a host's generated schema", () => {
    const Host$ = LOCKING_CONFIG_SCHEMA.extend({
      driver: LOCKING_CONFIG_SCHEMA.shape.driver.unwrap().default("memory"),
    });
    expect(Host$.parse({})).toMatchObject({ driver: "memory" });
  });
});
