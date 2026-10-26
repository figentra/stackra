/**
 * Stackra file contract:
 * Purpose: unit tests of `verifySignature`: a signature naming another key id or algorithm is false, a malformed key
 *          or signature is false rather than an error.
 * Boundary: test only; a memory signer makes the good signature.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySignerDriver } from "#core/drivers/memory-signer.driver";
import { verifySignature } from "#core/functions/verify-signature.function";

describe("verifySignature", () => {
  it("is false for another key id, a malformed key or a malformed signature", async () => {
    const signer = await MemorySignerDriver.generate("k1");
    const message = new TextEncoder().encode("checkpoint");
    const signature = await signer.sign(message);
    const key = await signer.publicKey();
    await expect(verifySignature(key, message, signature)).resolves.toBe(true);
    await expect(verifySignature({ ...key, keyId: "k2" }, message, signature)).resolves.toBe(false);
    await expect(verifySignature({ ...key, spki: "AAAA" }, message, signature)).resolves.toBe(
      false,
    );
    await expect(verifySignature(key, message, { ...signature, value: "AAAA" })).resolves.toBe(
      false,
    );
  });
});
