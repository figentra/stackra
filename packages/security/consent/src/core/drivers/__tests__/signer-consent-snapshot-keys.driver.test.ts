/**
 * Stackra file contract:
 * Purpose: unit tests of `SignerConsentSnapshotKeysDriver`: it is a `ConsentSnapshotKeys` and trusts the bound
 *          signer's public key, read once.
 * Boundary: test only; a fresh in-memory key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decision 2); ADR 0416.
 */
import { MemorySignerDriver } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ConsentSnapshotKeys } from "#contracts/ports/consent-snapshot-keys.port";
import { SignerConsentSnapshotKeysDriver } from "#core/drivers/signer-consent-snapshot-keys.driver";

describe("SignerConsentSnapshotKeysDriver", () => {
  it("trusts the signer's public key and reads it once", async () => {
    const signer = await MemorySignerDriver.generate("consent-1");
    const read = vi.spyOn(signer, "publicKey");
    const keys = new SignerConsentSnapshotKeysDriver(signer);
    expect(keys).toBeInstanceOf(ConsentSnapshotKeys);
    expect(await keys.trusted()).toEqual([await signer.publicKey()]);
    await keys.trusted();
    expect(read).toHaveBeenCalledTimes(2);
  });
});
