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
import { PAIRING_STATUS_SCHEMA } from "#core/constants/pairing-status-schema.constant";

describe("PAIRING_STATUS_SCHEMA", () => {
  it("takes a paired answer with its id and token, and a pending one with neither", () => {
    expect(PAIRING_STATUS_SCHEMA.parse({ state: "paired", deviceId: "dev_1", token: "t" })).toEqual(
      { state: "paired", deviceId: "dev_1", token: "t" },
    );
    expect(
      PAIRING_STATUS_SCHEMA.parse({ state: "pending", deviceId: null, token: null }).state,
    ).toBe("pending");
  });

  it("refuses a paired answer without a token and a token on any other", () => {
    expect(
      PAIRING_STATUS_SCHEMA.safeParse({ state: "paired", deviceId: "dev_1", token: null }).success,
    ).toBe(false);
    expect(
      PAIRING_STATUS_SCHEMA.safeParse({ state: "expired", deviceId: null, token: "t" }).success,
    ).toBe(false);
    expect(
      PAIRING_STATUS_SCHEMA.safeParse({ state: "done", deviceId: null, token: null }).success,
    ).toBe(false);
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
