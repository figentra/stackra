/**
 * Stackra file contract:
 * Purpose: unit tests of `GuardianLoginAttestationIssuer`: a sign-in within the configured window is attested for one
 *          guardian, person and document, with its auth time, methods and level, a `cgl_` id and the configured
 *          lifetime, in a token that decodes to exactly that; a call with no assurance, no auth time, a sign-in older
 *          than the window or one in the future past the clock skew is refused as not verified; a person cannot attest
 *          for themself.
 * Boundary: test only; a fixed clock and a fresh in-memory signer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0454 (Consequences); ADR 0207 (decision 1); STA-2818.
 */
import type { CallAssurance } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Driver } from "@stackra/container";
import { AssuranceLevel, Clock, MemorySignerDriver } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { ConsentConfig } from "#config/consent.config";
import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";
import { decodeGuardianLoginAttestation } from "#core/functions/decode-guardian-login-attestation.function";
import { GuardianLoginAttestationIssuer } from "#core/services/guardian-login-attestation-issuer.service";

const PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p1" as PublicId;
const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId;

/** Always 2026-11-26 10:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-11-26T10:00:00.000Z");
  }
}

/** A guardian session that authenticated at `authTime`. */
const signedInAt = (authTime: string | undefined): CallAssurance => ({
  amr: ["pwd", "otp"],
  authTime: authTime === undefined ? undefined : new Date(authTime),
  level: AssuranceLevel.Aal2,
});

/** An issuer with the default window (5 minutes) and lifetime (10 minutes). */
async function issuer(): Promise<GuardianLoginAttestationIssuer> {
  return new GuardianLoginAttestationIssuer(
    buildConfig(ConsentConfig),
    await MemorySignerDriver.generate("consent-1"),
    new FixedClockDriver(),
  );
}

/** Whether `promise` rejects with `ConsentNotVerifiedError`. */
const refusedAsNotVerified = async (promise: Promise<unknown>) =>
  isRefusal(
    await promise.then(
      () => undefined,
      (error: unknown) => error,
    ),
    ConsentNotVerifiedError,
  );

describe("GuardianLoginAttestationIssuer", () => {
  it("attests a fresh sign-in for one guardian, person and document", async () => {
    const { token, attestation } = await (
      await issuer()
    ).issue(PARENT, CHILD, "photos", signedInAt("2026-11-26T09:56:00.000Z"));
    expect(attestation).toEqual({
      kind: "consent_guardian_login",
      id: expect.stringMatching(/^cgl_[0-9a-z]{26}$/),
      givenBy: PARENT,
      subject: CHILD,
      document: "photos",
      authTime: "2026-11-26T09:56:00.000Z",
      amr: ["pwd", "otp"],
      level: AssuranceLevel.Aal2,
      issuedAt: "2026-11-26T10:00:00.000Z",
      expiresAt: "2026-11-26T10:10:00.000Z",
    });
    expect(decodeGuardianLoginAttestation(token)?.attestation).toEqual(attestation);
  });

  it("refuses a call with no recent sign-in", async () => {
    const attest = await issuer();
    expect(await refusedAsNotVerified(attest.issue(PARENT, CHILD, "photos", undefined))).toBe(true);
    expect(
      await refusedAsNotVerified(attest.issue(PARENT, CHILD, "photos", signedInAt(undefined))),
    ).toBe(true);
    expect(
      await refusedAsNotVerified(
        attest.issue(PARENT, CHILD, "photos", signedInAt("2026-11-26T09:54:59.000Z")),
      ),
    ).toBe(true);
    expect(
      await refusedAsNotVerified(
        attest.issue(PARENT, CHILD, "photos", signedInAt("2026-11-26T10:01:01.000Z")),
      ),
    ).toBe(true);
    expect(
      await refusedAsNotVerified(
        attest.issue(PARENT, CHILD, "photos", signedInAt("2026-11-26T09:55:00.000Z")),
      ),
    ).toBe(false);
  });

  it("attests a sign-in only for someone else", async () => {
    await expect(
      (await issuer()).issue(PARENT, PARENT, "photos", signedInAt("2026-11-26T09:59:00.000Z")),
    ).rejects.toBeInstanceOf(RangeError);
  });
});
