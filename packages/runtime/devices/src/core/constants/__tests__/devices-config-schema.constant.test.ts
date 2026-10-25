/**
 * Stackra file contract:
 * Purpose: unit tests of `DEVICES_CONFIG_SCHEMA`: full defaults from `{}`, equal to `DevicesOptions`' initializers, and
 *          the bounds it refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICES_CONFIG_SCHEMA } from "#core/constants/devices-config-schema.constant";
import { DevicesOptions } from "#core/schemas/devices-options.schema";

describe("DEVICES_CONFIG_SCHEMA", () => {
  it("gives the full defaults, equal to the shape's initializers", () => {
    expect(DEVICES_CONFIG_SCHEMA.parse({})).toEqual({ ...new DevicesOptions() });
    expect(DEVICES_CONFIG_SCHEMA.parse({})).toEqual({
      hubUrl: null,
      timeoutMs: 10_000,
      attempts: 3,
    });
  });

  it("refuses a relative URL, a zero timeout and attempts out of 1 to 10", () => {
    expect(DEVICES_CONFIG_SCHEMA.safeParse({ hubUrl: "/hub" }).success).toBe(false);
    expect(DEVICES_CONFIG_SCHEMA.safeParse({ timeoutMs: 0 }).success).toBe(false);
    expect(DEVICES_CONFIG_SCHEMA.safeParse({ attempts: 0 }).success).toBe(false);
    expect(DEVICES_CONFIG_SCHEMA.safeParse({ attempts: 11 }).success).toBe(false);
    expect(DEVICES_CONFIG_SCHEMA.safeParse({ attempts: 1.5 }).success).toBe(false);
  });
});
