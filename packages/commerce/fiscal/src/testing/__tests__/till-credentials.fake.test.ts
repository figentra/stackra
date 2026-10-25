/**
 * Stackra file contract:
 * Purpose: unit tests of `TillCredentialsFake`: holds one credential per unit and records reads and writes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { TillCredential } from "#contracts/types/till-credential.type";
import { TillCredentialsFake } from "#testing/till-credentials.fake";

const credential: TillCredential = {
  unitId: "u",
  stage: "production",
  requestId: null,
  token: null,
  secret: null,
  certificate: null,
  certificateSerial: "S",
};

describe("TillCredentialsFake", () => {
  it("starts from its list, replaces on save and records", async () => {
    const store = TillCredentialsFake.with([credential]);
    expect(store).toBeInstanceOf(TillCredentials);
    expect(await store.get("u")).toBe(credential);
    await store.save({ ...credential, certificateSerial: "T" });
    expect((await store.get("u"))?.certificateSerial).toBe("T");
    expect(await store.get("v")).toBeNull();
    expect(store.calls("get")).toEqual(["u", "u", "v"]);
  });
});
