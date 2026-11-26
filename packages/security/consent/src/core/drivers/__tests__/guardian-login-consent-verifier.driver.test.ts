/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardianLoginConsentVerifierDriver`, alone and behind `ConsentProofService`: a guardian who
 *          signed in gets their consent for the child recorded with the `guardian_login` method and the attestation's
 *          id as the reference; the verifier answers not verified, without throwing, for another method, a malformed or
 *          foreign token (a consent snapshot from the same key), an untrusted key, a tampered payload, another guardian,
 *          person or document, an attestation issued in the future past the skew, and an expired one; and the proof
 *          service then records nothing.
 * Boundary: test only; a settable clock, fresh in-memory signers, an authority that knows one guardian link and the
 *           memory proof store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0454 (Consequences); STA-1323; STA-2818.
 */
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { AssuranceLevel, Clock, MemorySignerDriver } from "@stackra/contracts";
import type { PublicId, Signer } from "@stackra/contracts";
import { base64url } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import { ConsentAuthority } from "#contracts/ports/consent-authority.port";
import { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";
import { GuardianLoginConsentVerifierDriver } from "#core/drivers/guardian-login-consent-verifier.driver";
import { MemoryConsentProofStoreDriver } from "#core/drivers/memory-consent-proof-store.driver";
import { StaticConsentSnapshotKeysDriver } from "#core/drivers/static-consent-snapshot-keys.driver";
import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";
import { encodeConsentSnapshot } from "#core/functions/encode-consent-snapshot.function";
import { ConsentProofService } from "#core/services/consent-proof.service";
import { GuardianLoginAttestationIssuer } from "#core/services/guardian-login-attestation-issuer.service";

const PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p1" as PublicId;
const OTHER_PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p2" as PublicId;
const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId;
const SIBLING = "usr_01j9z3k4m5n6p7q8r9s0t1v2c2" as PublicId;

/** A clock the test moves. */
class SettableClockDriver extends Driver(Clock) {
  at = new Date("2026-11-26T10:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

/** Knows that the parent is the child's guardian for photos. */
class OneLinkAuthorityDriver extends Driver(ConsentAuthority) {
  async relationshipOf(givenBy: PublicId, subject: PublicId, document: string) {
    return givenBy === PARENT && subject === CHILD && document === "photos"
      ? "guardian"
      : undefined;
  }
}

/** An issuer and a verifier sharing `signer`'s key, on one settable clock. */
async function setup() {
  const signer = await MemorySignerDriver.generate("consent-1");
  const clock = new SettableClockDriver();
  const config = buildConfig(ConsentConfig);
  const issuer = new GuardianLoginAttestationIssuer(config, signer, clock);
  const keys = new StaticConsentSnapshotKeysDriver().trust([await signer.publicKey()]);
  const verifier = new GuardianLoginConsentVerifierDriver(config, keys, clock);
  const store = new MemoryConsentProofStoreDriver();
  const proofs = new ConsentProofService(store, new OneLinkAuthorityDriver(), clock, verifier);
  /** A token for `PARENT`'s sign-in a minute ago, for `subject` and `document`, signed by `by`. */
  const attest = async (subject = CHILD, document = "photos", by: Signer = signer) =>
    (
      await new GuardianLoginAttestationIssuer(config, by, clock).issue(PARENT, subject, document, {
        amr: ["pwd", "otp"],
        authTime: new Date(clock.now().getTime() - 60_000),
        level: AssuranceLevel.Aal2,
      })
    ).token;
  return { signer, clock, issuer, verifier, store, proofs, attest };
}

/** A guardian-login request of `PARENT` for `CHILD` to photos with `evidence`. */
const request = (
  evidence: string,
  changes: Partial<ConsentVerificationRequest> = {},
): ConsentVerificationRequest => ({
  method: ConsentVerificationMethod.GuardianLogin,
  subject: CHILD,
  givenBy: PARENT,
  document: "photos",
  evidence,
  ...changes,
});

describe("GuardianLoginConsentVerifierDriver", () => {
  it("is a ConsentVerifier", async () => {
    expect((await setup()).verifier).toBeInstanceOf(ConsentVerifier);
  });

  it("records a signed-in guardian's consent with the method and the attestation id", async () => {
    const { proofs, attest } = await setup();
    const token = await attest();
    const proof = await proofs.answerFor(
      CHILD,
      PARENT,
      { key: "photos", version: "1", required: false },
      true,
      "guardian_app",
      { method: ConsentVerificationMethod.GuardianLogin, evidence: token },
    );
    expect(proof).toEqual({
      subject: CHILD,
      givenBy: PARENT,
      relationship: "guardian",
      document: "photos",
      version: "1",
      granted: true,
      at: "2026-11-26T10:00:00.000Z",
      channel: "guardian_app",
      verificationMethod: ConsentVerificationMethod.GuardianLogin,
      verificationReference: expect.stringMatching(/^cgl_[0-9a-z]{26}$/),
    });
    expect(await proofs.evidence(CHILD)).toEqual([proof]);
  });

  it("passes only the guardian_login method", async () => {
    const { verifier, attest } = await setup();
    const token = await attest();
    expect((await verifier.verify(request(token))).verified).toBe(true);
    expect(
      await verifier.verify(request(token, { method: ConsentVerificationMethod.CardCheck })),
    ).toEqual({ verified: false });
  });

  it("refuses a malformed token and a consent snapshot signed by the same key", async () => {
    const { verifier, signer } = await setup();
    const snapshot = await encodeConsentSnapshot(
      {
        id: "csn_1",
        subject: PARENT,
        policyVersion: "1",
        granted: ["necessary"],
        refused: [],
        regime: "gdpr",
        region: null,
        globalPrivacyControl: false,
        decidedAt: null,
        issuedAt: "2026-11-26T10:00:00.000Z",
        expiresAt: "2026-11-27T10:00:00.000Z",
      },
      signer,
    );
    for (const evidence of ["", "not.a.token", "a.b", snapshot, "x".repeat(9000)])
      expect(await verifier.verify(request(evidence))).toEqual({ verified: false });
  });

  it("refuses an untrusted key, another key under a trusted id and a tampered payload", async () => {
    const { verifier, attest } = await setup();
    for (const stranger of [
      await MemorySignerDriver.generate("consent-2"),
      await MemorySignerDriver.generate("consent-1"),
    ])
      expect(await verifier.verify(request(await attest(CHILD, "photos", stranger)))).toEqual({
        verified: false,
      });
    const [payload = "", keyId, signature] = (await attest()).split(".");
    const forged = JSON.parse(new TextDecoder().decode(base64url.decode(payload))) as Record<
      string,
      unknown
    >;
    const tampered = base64url.encode(
      new TextEncoder().encode(JSON.stringify({ ...forged, subject: SIBLING })),
    );
    expect(
      await verifier.verify(request(`${tampered}.${keyId}.${signature}`, { subject: SIBLING })),
    ).toEqual({ verified: false });
  });

  it("refuses an attestation for another guardian, person or document", async () => {
    const { verifier, attest } = await setup();
    const token = await attest();
    expect(await verifier.verify(request(token, { givenBy: OTHER_PARENT }))).toEqual({
      verified: false,
    });
    expect(await verifier.verify(request(token, { subject: SIBLING }))).toEqual({
      verified: false,
    });
    expect(await verifier.verify(request(token, { document: "terms" }))).toEqual({
      verified: false,
    });
  });

  it("counts an attestation from its issue, within the skew, until it expires", async () => {
    const { verifier, attest, clock } = await setup();
    clock.at = new Date("2026-11-26T10:02:00.000Z");
    const future = await attest();
    clock.at = new Date("2026-11-26T10:01:00.000Z");
    expect((await verifier.verify(request(future))).verified).toBe(true);
    clock.at = new Date("2026-11-26T10:00:59.000Z");
    expect(await verifier.verify(request(future))).toEqual({ verified: false });
    clock.at = new Date("2026-11-26T10:11:59.999Z");
    expect((await verifier.verify(request(future))).verified).toBe(true);
    clock.at = new Date("2026-11-26T10:12:00.000Z");
    expect(await verifier.verify(request(future))).toEqual({ verified: false });
  });

  it("lets the proof service record nothing when the attestation does not verify", async () => {
    const { proofs, attest, store, clock } = await setup();
    const token = await attest();
    clock.at = new Date("2026-11-26T11:00:00.000Z");
    await expect(
      proofs.answerFor(
        CHILD,
        PARENT,
        { key: "photos", version: "1", required: false },
        true,
        "app",
        {
          method: ConsentVerificationMethod.GuardianLogin,
          evidence: token,
        },
      ),
    ).rejects.toBeInstanceOf(ConsentNotVerifiedError);
    expect(await store.list(CHILD)).toEqual([]);
  });
});
