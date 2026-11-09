/**
 * Stackra file contract:
 * Purpose: unit tests of `EphemeralSignerDriver`: a `Signer` whose signatures verify against its own public key, one
 *          key pair per instance made on first use, named by the config's key id or `ephemeral`.
 * Boundary: test only; Web Crypto in process, no container.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0416.
 */
import { Signer, verifySignature } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SignerConfig } from "#config/signer.config";
import { EphemeralSignerDriver } from "#core/drivers/ephemeral-signer.driver";
import { buildConfig } from "#core/functions/build-config.function";

const MESSAGE = new TextEncoder().encode("usage report 2026-11");

describe("EphemeralSignerDriver", () => {
  it("is a Signer whose signatures verify against its public key", async () => {
    const signer = new EphemeralSignerDriver(buildConfig(SignerConfig, { values: {} }));
    expect(signer).toBeInstanceOf(Signer);
    const signature = await signer.sign(MESSAGE);
    const key = await signer.publicKey();
    expect(signature).toMatchObject({ keyId: "ephemeral", algorithm: "ES256" });
    expect(key.keyId).toBe("ephemeral");
    await expect(verifySignature(key, MESSAGE, signature)).resolves.toBe(true);
  });

  it("keeps one key pair per instance, named by the config's key id", async () => {
    const config = buildConfig(SignerConfig, { values: { keyId: "usage-dev" } });
    const signer = new EphemeralSignerDriver(config);
    expect(await signer.publicKey()).toEqual(await signer.publicKey());
    expect((await signer.sign(MESSAGE)).keyId).toBe("usage-dev");
    // Another instance (another process) has another key: the first one's signature does not verify under it.
    const other = new EphemeralSignerDriver(config);
    await expect(
      verifySignature(await other.publicKey(), MESSAGE, await signer.sign(MESSAGE)),
    ).resolves.toBe(false);
  });
});
