/**
 * Stackra file contract:
 * Purpose: unit tests of `DEVICE_COMMAND_LIST_SCHEMA`: instants decoded into `Date`, unknown keys dropped, a null
 *          expiry kept, and a malformed body refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0235 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { DEVICE_COMMAND_LIST_SCHEMA } from "#core/constants/device-command-list-schema.constant";

describe("DEVICE_COMMAND_LIST_SCHEMA", () => {
  it("decodes each command's instants and drops unknown keys", () => {
    const body = DEVICE_COMMAND_LIST_SCHEMA.parse({
      items: [
        {
          id: "cmd_1",
          name: "set_interval",
          payload: { seconds: 30, labels: ["a"] },
          issuedAt: "2026-10-24T09:00:00Z",
          expiresAt: null,
          tenant: "ignored",
        },
      ],
    });
    expect(body.items).toEqual([
      {
        id: "cmd_1",
        name: "set_interval",
        payload: { seconds: 30, labels: ["a"] },
        issuedAt: new Date("2026-10-24T09:00:00.000Z"),
        expiresAt: null,
      },
    ]);
  });

  it("refuses a missing id, an empty name and a date that is not ISO 8601", () => {
    const valid = {
      id: "cmd_1",
      name: "reboot",
      payload: {},
      issuedAt: "2026-10-24T09:00:00Z",
      expiresAt: "2026-10-24T10:00:00Z",
    };
    expect(DEVICE_COMMAND_LIST_SCHEMA.safeParse({ items: [valid] }).success).toBe(true);
    expect(
      DEVICE_COMMAND_LIST_SCHEMA.safeParse({ items: [{ ...valid, id: undefined }] }).success,
    ).toBe(false);
    expect(DEVICE_COMMAND_LIST_SCHEMA.safeParse({ items: [{ ...valid, name: "" }] }).success).toBe(
      false,
    );
    expect(
      DEVICE_COMMAND_LIST_SCHEMA.safeParse({ items: [{ ...valid, issuedAt: "yesterday" }] })
        .success,
    ).toBe(false);
    expect(DEVICE_COMMAND_LIST_SCHEMA.safeParse({}).success).toBe(false);
  });
});
