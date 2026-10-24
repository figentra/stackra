/**
 * Stackra file contract:
 * Purpose: unit tests of `PUSH_CONFIG_SCHEMA` (`PushConfig$`): its defaults equal `PushOptions`' initializers, a field
 *          can be unwrapped and re-defaulted the way a generated override does it, and bad values are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0255 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { PUSH_CONFIG_SCHEMA } from "#core/constants/push-config-schema.constant";
import { PushOptions } from "#core/schemas/push-options.schema";

describe("PUSH_CONFIG_SCHEMA", () => {
  it("defaults to PushOptions' initializers", () => {
    expect(PUSH_CONFIG_SCHEMA.parse({})).toEqual({ ...new PushOptions() });
  });

  it("extends the way a generated override does", () => {
    const override = PUSH_CONFIG_SCHEMA.extend({
      provider: PUSH_CONFIG_SCHEMA.shape.provider.unwrap().default("expo"),
    });
    expect(override.parse({}).provider).toBe("expo");
  });

  it("refuses an unknown transport, a negative retry count and a bad channel id", () => {
    expect(PUSH_CONFIG_SCHEMA.safeParse({ provider: "fax" }).success).toBe(false);
    expect(PUSH_CONFIG_SCHEMA.safeParse({ retries: -1 }).success).toBe(false);
    expect(
      PUSH_CONFIG_SCHEMA.safeParse({
        androidChannels: [
          { id: "Orders", nameKey: "k", importance: "high", vibrate: true, sound: null },
        ],
      }).success,
    ).toBe(false);
  });
});
