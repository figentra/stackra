/**
 * Stackra file contract:
 * Purpose: unit tests of `PAIRING_STATUS_SCHEMA` and `PAIRING_CODE_SCHEMA`: a paired answer must carry the device id
 *          and the token, no other answer may carry a token, and a code's expiry decodes to a `Date`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0361 (decision 7); ADR 0095 as amended.
 */
import { describe, expect, it } from "@stackra/testing";

import { PAIRING_CODE_SCHEMA } from "#core/constants/pairing-code-schema.constant";
import { PAIRING_PICKUP_SCHEMA } from "#core/constants/pairing-pickup-schema.constant";
import { PAIRING_STATUS_SCHEMA } from "#core/constants/pairing-status-schema.constant";

describe("PAIRING_STATUS_SCHEMA", () => {
  it("takes a paired answer with its id, and a pending one without", () => {
    expect(PAIRING_STATUS_SCHEMA.parse({ state: "paired", deviceId: "dev_1" })).toEqual({
      state: "paired",
      deviceId: "dev_1",
    });
    expect(PAIRING_STATUS_SCHEMA.parse({ state: "pending", deviceId: null }).state).toBe("pending");
  });

  it("never yields a credential, even from an answer that carries one", () => {
    expect(
      PAIRING_STATUS_SCHEMA.parse({ state: "paired", deviceId: "dev_1", token: "t" }),
    ).not.toHaveProperty("token");
  });

  it("refuses a paired answer without the id and an unknown state", () => {
    expect(PAIRING_STATUS_SCHEMA.safeParse({ state: "paired", deviceId: null }).success).toBe(
      false,
    );
    expect(PAIRING_STATUS_SCHEMA.safeParse({ state: "done", deviceId: null }).success).toBe(false);
  });
});

describe("PAIRING_PICKUP_SCHEMA", () => {
  it("takes the id and the token, and refuses an answer without the token", () => {
    expect(PAIRING_PICKUP_SCHEMA.parse({ deviceId: "dev_1", token: "t" })).toEqual({
      deviceId: "dev_1",
      token: "t",
    });
    expect(PAIRING_PICKUP_SCHEMA.safeParse({ deviceId: "dev_1", token: null }).success).toBe(false);
  });
});

describe("PAIRING_CODE_SCHEMA", () => {
  it("decodes the expiry", () => {
    const parsed = PAIRING_CODE_SCHEMA.parse({
      pairingId: "pr_1",
      code: "K7Q4M2XR",
      expiresAt: "2026-10-25T10:10:00Z",
    });
    expect(parsed.expiresAt).toEqual(new Date("2026-10-25T10:10:00Z"));
  });
});
