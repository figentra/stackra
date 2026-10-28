/**
 * Stackra file contract:
 * Purpose: unit tests of `SnapshotConsentCheckDriver`: it is a `ConsentCheck` and answers what the verifier answers
 *          for the call's snapshot, refused or verified.
 * Boundary: test only; the verifier trusts a fresh in-memory key and time is frozen.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decisions 3 and 4).
 */
import { ConsentCheck, ConsentRefusal } from "@stackra/actions/contracts";
import type { CallDescriptor } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { MemorySignerDriver } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { SignerConsentSnapshotKeysDriver } from "#core/drivers/signer-consent-snapshot-keys.driver";
import { SnapshotConsentCheckDriver } from "#core/drivers/snapshot-consent-check.driver";
import { ConsentSnapshotIssuer } from "#core/services/consent-snapshot-issuer.service";
import { ConsentSnapshotVerifier } from "#core/services/consent-snapshot-verifier.service";

describe("SnapshotConsentCheckDriver", () => {
  it("answers the verifier's verdict for the call's snapshot", async () => {
    freezeClock("2026-10-28T09:00:00Z");
    const config = buildConfig(ConsentConfig);
    const signer = await MemorySignerDriver.generate("consent-1");
    const check = new SnapshotConsentCheckDriver(
      new ConsentSnapshotVerifier(config, new SignerConsentSnapshotKeysDriver(signer)),
    );
    expect(check).toBeInstanceOf(ConsentCheck);
    const call = { key: "orders.order.place" } as unknown as CallDescriptor;
    const { token } = await new ConsentSnapshotIssuer(config, signer).issue({
      record: null,
      globalPrivacyControl: false,
      region: null,
    });
    expect(await check.check(token, call)).toMatchObject({
      verified: true,
      granted: ["necessary"],
    });
    expect(await check.check("forged", call)).toEqual({
      verified: false,
      refusal: ConsentRefusal.Malformed,
      granted: [],
    });
  });
});
