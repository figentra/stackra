/**
 * Stackra file contract:
 * Purpose: unit tests of `dataKey` under Pulumi's mocks: a key ring in the region and an encrypt/decrypt key in it
 *          that rotates yearly and waits 30 days before destruction.
 * Boundary: test only; no engine and no cloud call.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0354 (decision 3), ADR 0171 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { dataKey } from "#node/functions/data-key.function";
import { mockPulumi } from "#testing/functions/mock-pulumi.function";
import { outputOf } from "#testing/functions/output-of.function";

describe("dataKey", () => {
  it("creates a rotating key in a regional key ring", async () => {
    const engine = await mockPulumi();
    const key = dataKey(
      "acme-staging",
      { project: "acme-stg", region: "europe-west3", ring: "acme-staging" },
      {},
    );

    expect((await engine.find("KeyRing", "acme-staging")).inputs).toMatchObject({
      name: "acme-staging",
      project: "acme-stg",
      location: "europe-west3",
    });
    expect((await engine.find("CryptoKey", "acme-staging")).inputs).toMatchObject({
      name: "data",
      keyRing: "acme-staging-id",
      purpose: "ENCRYPT_DECRYPT",
      rotationPeriod: "31536000s",
      destroyScheduledDuration: "2592000s",
    });
    expect(await outputOf(key.id)).toBe("acme-staging-id");
  });
});
