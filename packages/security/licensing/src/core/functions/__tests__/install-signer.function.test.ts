/**
 * Stackra file contract:
 * Purpose: unit tests of `installSigner`: a signer over a generated install key signs what `verifySignature` accepts
 *          with the registered public key; a text that is not a P-256 private JWK is refused without quoting it.
 * Boundary: test only; keys are generated per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0178 (decision 5); ADR 0416.
 */
import { verifySignature } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { generateInstallKey } from "#core/functions/generate-install-key.function";
import { installSigner } from "#core/functions/install-signer.function";

describe("installSigner", () => {
  it("signs with the stored key so the registered public key verifies", async () => {
    const key = await generateInstallKey("acme-onprem-1");
    const signer = await installSigner("acme-onprem-1", key.privateKey);
    const message = new TextEncoder().encode("report");
    const signature = await signer.sign(message);
    expect(await verifySignature(key.publicKey, message, signature)).toBe(true);
    expect(await signer.publicKey()).toEqual(key.publicKey);
  });

  it.each([["not json"], ['{"kty":"EC","crv":"P-256"}'], ['{"kty":"RSA"}']])(
    "refuses %s without quoting it",
    async (text) => {
      const error: unknown = await installSigner("k", text).catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(RangeError);
      expect((error as RangeError).message).not.toContain(text);
    },
  );

  it("refuses an empty key id", async () => {
    const key = await generateInstallKey("k");
    await expect(installSigner("", key.privateKey)).rejects.toBeInstanceOf(RangeError);
  });
});
