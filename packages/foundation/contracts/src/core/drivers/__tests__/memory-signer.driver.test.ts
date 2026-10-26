/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySignerDriver` with `verifySignature`: it is the `Signer` port; a signature names the
 *          key, verifies against the public key over the same bytes only, fails for another key or a changed
 *          message; an empty key id is refused.
 * Boundary: test only; real Web Crypto over generated keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { MemorySignerDriver } from "#core/drivers/memory-signer.driver";
import { verifySignature } from "#core/functions/verify-signature.function";
import { Signer } from "#core/ports/signer.port";

const bytes = (text: string) => new TextEncoder().encode(text);

describe("MemorySignerDriver", () => {
  it("signs what its public key verifies, and nothing else", async () => {
    const signer = await MemorySignerDriver.generate("audit-dev");
    expect(signer).toBeInstanceOf(Signer);
    const signature = await signer.sign(bytes('{"hash":"ab","sequence":1}'));
    const key = await signer.publicKey();
    expect(signature).toMatchObject({ keyId: "audit-dev", algorithm: "ES256" });
    expect(key.keyId).toBe("audit-dev");
    await expect(
      verifySignature(key, bytes('{"hash":"ab","sequence":1}'), signature),
    ).resolves.toBe(true);
    await expect(
      verifySignature(key, bytes('{"hash":"ab","sequence":2}'), signature),
    ).resolves.toBe(false);
    const other = await (await MemorySignerDriver.generate("audit-dev")).publicKey();
    await expect(
      verifySignature(other, bytes('{"hash":"ab","sequence":1}'), signature),
    ).resolves.toBe(false);
  });

  it("refuses an empty key id", async () => {
    const keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ]);
    expect(() => new MemorySignerDriver("", keys)).toThrow(RangeError);
  });
});
