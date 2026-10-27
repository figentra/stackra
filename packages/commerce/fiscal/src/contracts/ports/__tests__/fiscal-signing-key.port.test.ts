/**
 * Stackra file contract:
 * Purpose: unit tests of `FiscalSigningKey`: an abstract port a host implements, signing bytes and answering the
 *          certificate's public facts.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { FiscalSigningKey } from "#contracts/ports/fiscal-signing-key.port";
import type { SigningCertificate } from "#contracts/types/signing-certificate.type";

/** A host key with no certificate that signs with the message length. */
class LengthKey extends FiscalSigningKey {
  async sign(_unitId: string, message: Uint8Array): Promise<string> {
    return String(message.length);
  }

  async certificate(_unitId: string): Promise<SigningCertificate | null> {
    return null;
  }
}

describe("FiscalSigningKey", () => {
  it("is a port that signs bytes and reads a certificate", async () => {
    const key = new LengthKey();
    expect(key).toBeInstanceOf(Port);
    expect(await key.sign("u", new Uint8Array(3))).toBe("3");
    expect(await key.certificate("u")).toBeNull();
  });
});
