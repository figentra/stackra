/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentSnapshotVerifier`: a valid snapshot is verified with its id, subject, grants and
 *          expiry; each failure reads as refused with nothing granted and its own reason, in the fixed order (missing,
 *          malformed, untrusted key, bad signature, not yet valid, expired, policy outdated, Global Privacy Control);
 *          a snapshot issued within the clock skew counts; it never throws.
 * Boundary: test only; time is frozen and snapshots are signed with fresh in-memory keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decisions 2 to 4); ADR 0298 (decision 1).
 */
import { ConsentRefusal } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { MemorySignerDriver } from "@stackra/contracts";
import type { Signer } from "@stackra/contracts";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";
import { StaticConsentSnapshotKeysDriver } from "#core/drivers/static-consent-snapshot-keys.driver";
import { encodeConsentSnapshot } from "#core/functions/encode-consent-snapshot.function";
import { ConsentSnapshotVerifier } from "#core/services/consent-snapshot-verifier.service";

/** A snapshot granting analytics, issued at 09:00 for a day. */
const SNAPSHOT: ConsentSnapshot = {
  id: "csn_1",
  subject: "anon_1",
  policyVersion: "2026-10",
  granted: ["necessary", "analytics"],
  refused: ["marketing"],
  regime: "gdpr",
  region: null,
  globalPrivacyControl: false,
  decidedAt: "2026-10-28T08:00:00.000Z",
  issuedAt: "2026-10-28T09:00:00.000Z",
  expiresAt: "2026-10-29T09:00:00.000Z",
};

/** A verifier trusting `signer`'s key, and a token signer for `snapshot`. */
async function setup(): Promise<{
  verifier: ConsentSnapshotVerifier;
  signer: Signer;
  sign: (changes?: Partial<ConsentSnapshot>, by?: Signer) => Promise<string>;
}> {
  const signer = await MemorySignerDriver.generate("consent-1");
  const config = buildConfig(ConsentConfig, { values: { policyVersion: "2026-10" } });
  const verifier = new ConsentSnapshotVerifier(
    config,
    new StaticConsentSnapshotKeysDriver([await signer.publicKey()]),
  );
  return {
    verifier,
    signer,
    sign: (changes = {}, by = signer) => encodeConsentSnapshot({ ...SNAPSHOT, ...changes }, by),
  };
}

/** A refusal for `reason`. */
const refusedFor = (reason: ConsentRefusal) => ({ verified: false, refusal: reason, granted: [] });

describe("ConsentSnapshotVerifier", () => {
  it("verifies a current snapshot from a trusted key", async () => {
    freezeClock("2026-10-28T10:00:00Z");
    const { verifier, sign } = await setup();
    expect(await verifier.verify(await sign())).toEqual({
      verified: true,
      snapshotId: "csn_1",
      subject: "anon_1",
      granted: ["necessary", "analytics"],
      expiresAt: new Date("2026-10-29T09:00:00.000Z"),
    });
  });

  it("reads an empty token as missing and garbage as malformed", async () => {
    const { verifier } = await setup();
    expect(await verifier.verify("")).toEqual(refusedFor(ConsentRefusal.Missing));
    expect(await verifier.verify("not.a.token")).toEqual(refusedFor(ConsentRefusal.Malformed));
  });

  it("refuses a key it does not trust", async () => {
    freezeClock("2026-10-28T10:00:00Z");
    const { verifier, sign } = await setup();
    const stranger = await MemorySignerDriver.generate("other-key");
    expect(await verifier.verify(await sign({}, stranger))).toEqual(
      refusedFor(ConsentRefusal.UntrustedKey),
    );
  });

  it("refuses a payload changed after signing", async () => {
    freezeClock("2026-10-28T10:00:00Z");
    const { verifier, sign } = await setup();
    const [, keyId, signature] = (await sign()).split(".");
    const [forged] = (await sign({ granted: ["necessary", "analytics", "marketing"] })).split(".");
    const other = await MemorySignerDriver.generate("consent-1");
    const [, , otherSignature] = (await sign({}, other)).split(".");
    expect(await verifier.verify(`${forged}.${keyId}.${signature}`)).toEqual(
      refusedFor(ConsentRefusal.BadSignature),
    );
    expect(await verifier.verify(`${forged}.${keyId}.${otherSignature}`)).toEqual(
      refusedFor(ConsentRefusal.BadSignature),
    );
  });

  it("allows the clock skew and refuses a snapshot issued beyond it", async () => {
    freezeClock("2026-10-28T08:59:30Z");
    const { verifier, sign } = await setup();
    expect((await verifier.verify(await sign())).verified).toBe(true);
    freezeClock("2026-10-28T08:58:00Z");
    expect(await verifier.verify(await sign())).toEqual(refusedFor(ConsentRefusal.NotYetValid));
  });

  it("refuses an expired snapshot", async () => {
    freezeClock("2026-10-29T09:00:00Z");
    const { verifier, sign } = await setup();
    expect(await verifier.verify(await sign())).toEqual(refusedFor(ConsentRefusal.Expired));
  });

  it("refuses a snapshot for another policy version", async () => {
    freezeClock("2026-10-28T10:00:00Z");
    const { verifier, sign } = await setup();
    expect(await verifier.verify(await sign({ policyVersion: "2026-09" }))).toEqual(
      refusedFor(ConsentRefusal.PolicyOutdated),
    );
  });

  it("refuses a snapshot that records Global Privacy Control", async () => {
    freezeClock("2026-10-28T10:00:00Z");
    const { verifier, sign } = await setup();
    expect(await verifier.verify(await sign({ globalPrivacyControl: true }))).toEqual(
      refusedFor(ConsentRefusal.GlobalPrivacyControl),
    );
  });
});
