/**
 * Stackra file contract:
 * Purpose: unit tests of `NOTIFICATIONS_CONFIG_SCHEMA`: `.parse({})` gives the memory driver, a known driver passes and
 *          an unknown one is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); ADR 0266 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { NOTIFICATIONS_CONFIG_SCHEMA } from "#core/constants/notifications-config-schema.constant";

describe("NOTIFICATIONS_CONFIG_SCHEMA", () => {
  it("defaults to the memory driver", () => {
    expect(NOTIFICATIONS_CONFIG_SCHEMA.parse({})).toEqual({ driver: "memory" });
  });

  it("accepts the notifications driver", () => {
    expect(NOTIFICATIONS_CONFIG_SCHEMA.parse({ driver: "notifications" })).toEqual({
      driver: "notifications",
    });
  });

  it("refuses a driver this package does not ship", () => {
    expect(NOTIFICATIONS_CONFIG_SCHEMA.safeParse({ driver: "smtp" }).success).toBe(false);
  });
});
