/**
 * Stackra file contract:
 * Purpose: unit tests of `C2paContentCredentialsDriver`: it signs with the certificate and key from the secret store
 *          and the configured algorithm and time-stamp authority, embeds the manifest that states the credential,
 *          refuses while the certificate is not set or for a format it does not sign, and reads the recorded store back
 *          as a credential (`null` when the engine finds none).
 * Boundary: test only; `@contentauth/c2pa-node` is replaced with a recording stand-in, since no signing certificate
 *           exists yet (owner D3, certification pending). No file or network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173; COM-73, COM-294; STA-789.
 */
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { ContentCredentials } from "#contracts/ports/content-credentials.port";
import { C2paContentCredentialsDriver } from "#node/drivers/c2pa-content-credentials.driver";
import { C2PA_AI_IMAGE_STORE } from "#node/functions/__tests__/c2pa-store.fixture";
import { c2paManifestOf } from "#node/functions/c2pa-manifest-of.function";

const engine = vi.hoisted(() => {
  const sign = vi.fn(
    (_signer: unknown, input: { buffer: Buffer }, output: { buffer: Buffer | null }) => {
      output.buffer = Buffer.concat([input.buffer, Buffer.from("C2PA")]);
      return Buffer.from("manifest");
    },
  );
  return {
    sign,
    withJson: vi.fn(() => ({ sign })),
    newSigner: vi.fn(() => ({ alg: () => "es256" })),
    fromAsset: vi.fn(),
  };
});

vi.mock("@contentauth/c2pa-node", () => ({
  Builder: { withJson: engine.withJson },
  LocalSigner: { newSigner: engine.newSigner },
  Reader: { fromAsset: engine.fromAsset },
}));

const credential = {
  generator: "figentra-ai/1.4",
  aiGenerated: true,
  createdAt: new Date("2026-10-27T10:00:00Z"),
};

/** The driver, with the certificate secrets set unless `signed` is false. */
function driver(signed = true, timestampUrl = ""): C2paContentCredentialsDriver {
  const secrets = new MemorySecretStoreDriver();
  if (signed)
    secrets.set("MEDIA_C2PA_SIGNING_CERTIFICATE", "CERT").set("MEDIA_C2PA_SIGNING_KEY", "KEY");
  return new C2paContentCredentialsDriver(
    buildConfig(MediaConfig, { values: { c2pa: { algorithm: "ps256", timestampUrl } }, secrets }),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("C2paContentCredentialsDriver", () => {
  it("is a driver of ContentCredentials", () => {
    expect(driver()).toBeInstanceOf(ContentCredentials);
    expect(kindOf(C2paContentCredentialsDriver)).toEqual({
      kind: "driver",
      options: { port: ContentCredentials },
    });
  });

  it("signs with the secret certificate and embeds the credential's manifest", async () => {
    const signed = await driver(true, "http://tsa.example.test").attach(
      new Uint8Array([1, 2]),
      "Image/PNG",
      credential,
    );
    expect(Buffer.from(signed).toString("latin1")).toBe("\u0001\u0002C2PA");
    expect(engine.newSigner).toHaveBeenCalledWith(
      Buffer.from("CERT"),
      Buffer.from("KEY"),
      "ps256",
      "http://tsa.example.test",
    );
    expect(engine.withJson).toHaveBeenCalledWith(c2paManifestOf(credential, "image/png"));
    expect(engine.sign.mock.calls[0]?.[1]).toMatchObject({ mimeType: "image/png" });
  });

  it("signs without a time-stamp authority when none is set", async () => {
    await driver().attach(new Uint8Array(1), "image/jpeg", credential);
    expect(engine.newSigner.mock.calls[0]).toEqual([
      Buffer.from("CERT"),
      Buffer.from("KEY"),
      "ps256",
      undefined,
    ]);
  });

  it("refuses while the certificate is not set, and a format it does not sign", async () => {
    await expect(driver(false).attach(new Uint8Array(1), "image/png", credential)).rejects.toThrow(
      RangeError,
    );
    await expect(driver().attach(new Uint8Array(1), "image/gif", credential)).rejects.toThrow(
      RangeError,
    );
    await expect(driver().read(new Uint8Array(1), "application/pdf")).rejects.toThrow(RangeError);
    expect(engine.sign).not.toHaveBeenCalled();
  });

  it("reads the recorded store back as a credential", async () => {
    engine.fromAsset.mockResolvedValueOnce({ json: () => C2PA_AI_IMAGE_STORE });
    expect(await driver(false).read(new Uint8Array(1), "image/png")).toEqual({
      generator: "figentra-ai/1.4 (image model)",
      aiGenerated: true,
      createdAt: new Date("2026-10-27T10:00:00.000Z"),
    });
  });

  it("is null when the engine finds no manifest", async () => {
    engine.fromAsset.mockRejectedValueOnce(new Error("JumbfNotFound"));
    expect(await driver().read(new Uint8Array(1), "image/png")).toBeNull();
    engine.fromAsset.mockResolvedValueOnce(null);
    expect(await driver().read(new Uint8Array(1), "image/png")).toBeNull();
  });
});
