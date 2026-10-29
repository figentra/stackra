/**
 * Stackra file contract:
 * Purpose: unit tests of `StaticConsentSnapshotKeysDriver`: it trusts exactly the keys handed in, and an empty list
 *          trusts nothing.
 * Boundary: test only; fresh in-memory keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decision 2); ADR 0416.
 */
import { MemorySignerDriver } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { StaticConsentSnapshotKeysDriver } from "#core/drivers/static-consent-snapshot-keys.driver";

describe("StaticConsentSnapshotKeysDriver", () => {
  it("trusts exactly the keys handed in", async () => {
    const current = await (await MemorySignerDriver.generate("consent-2")).publicKey();
    const previous = await (await MemorySignerDriver.generate("consent-1")).publicKey();
    expect(
      await new StaticConsentSnapshotKeysDriver().trust([current, previous]).trusted(),
    ).toEqual([current, previous]);
    expect(await new StaticConsentSnapshotKeysDriver().trusted()).toEqual([]);
    expect(await new StaticConsentSnapshotKeysDriver().trust([]).trusted()).toEqual([]);
  });
});
