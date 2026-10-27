/**
 * Stackra file contract:
 * Purpose: `FiscalSigningKeyFake`, a deterministic `FiscalSigningKey`: the signature is base64 SHA-256 of the unit and
 *          the message, and the certificate facts are fixed samples (or none, for a unit not yet onboarded).
 * Boundary: built on `Fake` of @stackra/testing; no key, so tests check what was asked and that output is stable,
 *           never cryptographic validity.
 * Runtime: isomorphic
 * Governing contract: ADR 0269; ADR 0266 (decision 2); ADR 0364.
 */
import { Fake } from "@stackra/testing";

import { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import type { SigningCertificate } from "#contracts/types/signing-certificate.type";
import { sha256 } from "#core/functions/sha256.function";
import { toBase64 } from "#core/functions/to-base64.function";
import { toHex } from "#core/functions/to-hex.function";

/** The sample certificate facts every unit has unless the fake is built without one. */
const SAMPLE: SigningCertificate = {
  certificate: toBase64("certificate"),
  issuerName: "CN=Sample Issuing CA",
  serialNumber: "1234567890",
  publicKey: toBase64("public-key"),
  certificateSignature: toBase64("certificate-signature"),
};

/**
 * A `FiscalSigningKey` fake that signs deterministically and records its calls.
 *
 * @example
 * const key = new FiscalSigningKeyFake();
 * key.calls("sign"); // every { unitId, message }
 */
export class FiscalSigningKeyFake extends Fake.of(FiscalSigningKey) {
  /** The facts answered for every unit; `null` for a unit with no certificate. */
  private readonly facts: SigningCertificate | null;

  /**
   * @param facts - the certificate facts to answer; the sample when left out.
   */
  constructor(facts: SigningCertificate | null = SAMPLE) {
    super();
    this.facts = facts;
  }

  /** Recorded, then a stable signature over the unit and the message. */
  async sign(unitId: string, message: Uint8Array): Promise<string> {
    this.record("sign", { unitId, message });
    return toBase64(await sha256(`${unitId}|${toHex(message)}`));
  }

  /** Recorded, then the facts. */
  async certificate(unitId: string): Promise<SigningCertificate | null> {
    this.record("certificate", unitId);
    return this.facts;
  }
}
