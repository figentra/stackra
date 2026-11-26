/**
 * Stackra file contract:
 * Purpose: unit tests of `C2paContentCredentialsDriver`: it signs with the certificate and key from the secret store
 *          and the configured algorithm and time-stamp authority, embeds the manifest that states the credential,
 *          refuses while the certificate is not set or for a format it does not sign, reads the recorded store back
 *          as an `unverified` credential (`trusted` only when the engine vouches for the signer, `invalid` when the
 *          store does not verify, `null` when the engine finds none), and hands the engine the pinned trust list and
 *          our own signers valid now, with no remote manifest or OCSP fetch.
 * Boundary: test only; `@contentauth/c2pa-node` is replaced with a recording stand-in, so it runs on every platform
 *           (the real engine's round trip is `c2pa-round-trip.test.ts`). Certificates are made in memory by
 *           `c2paTestCertificate()`. No file or network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173; COM-73, COM-294; STA-789; STA-2791 (CTO decision of 2026-11-25).
 */
import { X509Certificate } from "node:crypto";

import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import { ContentCredentials } from "#contracts/ports/content-credentials.port";
import { C2PA_TRUST_LIST } from "#node/constants/c2pa-trust-list.constant";
import { c2paTestCertificate } from "#node/drivers/__tests__/c2pa-test-certificate.fixture";
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
    /** Records the settings each `Context` is made with. */
    Context: class {
      constructor(readonly settings: unknown) {}
    },
  };
});

vi.mock("@contentauth/c2pa-node", () => ({
  Builder: { withJson: engine.withJson },
  Context: engine.Context,
  LocalSigner: { newSigner: engine.newSigner },
  Reader: { fromAsset: engine.fromAsset },
}));

const credential = {
  generator: "figentra-ai/1.4",
  aiGenerated: true,
  createdAt: new Date("2026-10-27T10:00:00Z"),
};

/** The recorded credential `C2PA_AI_IMAGE_STORE` states. */
const RECORDED = {
  generator: "figentra-ai/1.4 (image model)",
  aiGenerated: true,
  createdAt: new Date("2026-10-27T10:00:00.000Z"),
};

/** The driver, with the certificate secrets set unless `signed` is false. */
function driver(
  signed = true,
  timestampUrl = "",
  signing: { certificate: string; key: string } = { certificate: "CERT", key: "KEY" },
  trustedSigners: string[] = [],
): C2paContentCredentialsDriver {
  const secrets = new MemorySecretStoreDriver();
  if (signed)
    secrets
      .set("MEDIA_C2PA_SIGNING_CERTIFICATE", signing.certificate)
      .set("MEDIA_C2PA_SIGNING_KEY", signing.key);
  return new C2paContentCredentialsDriver(
    buildConfig(MediaConfig, {
      values: {
        c2pa: {
          algorithm: "ps256",
          timestampUrl,
          formats: ["image/jpeg", "image/png", "image/webp"],
          trustedSigners,
        },
      },
      secrets,
    }),
  );
}

/** The settings the engine was last asked to read with. */
function readSettings(): {
  verify: Record<string, boolean>;
  trust?: { trustAnchors: string; allowedList?: string };
} {
  const context = engine.fromAsset.mock.calls.at(-1)?.[1] as { settings: never } | undefined;
  if (context === undefined) throw new Error("The engine was not asked to read");
  return context.settings;
}

/** The certificates of a PEM text. */
function certificates(pem: string | undefined): X509Certificate[] {
  return (pem?.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) ?? []).map(
    (block) => new X509Certificate(block),
  );
}

/** The certificates of a PEM text, by fingerprint. */
function fingerprints(pem: string | undefined): string[] {
  return certificates(pem).map(({ fingerprint256 }) => fingerprint256);
}

/** The engine answers the recorded store with `changes` on top. */
function engineReads(changes: object): void {
  engine.fromAsset.mockResolvedValueOnce({ json: () => ({ ...C2PA_AI_IMAGE_STORE, ...changes }) });
}

/** A driver whose trust list is `list` (or throws), signing with nothing. */
function withList(list: () => string): C2paContentCredentialsDriver {
  return new (class extends C2paContentCredentialsDriver {
    protected override trustList(): string {
      return list();
    }
  })(buildConfig(MediaConfig, {}));
}

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
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

  it("reads a store that verifies, with no trusted signer, as an unverified credential", async () => {
    // The recorded store is Valid: its signer chains to no anchor, the self-made CA case.
    engine.fromAsset.mockResolvedValueOnce({ json: () => C2PA_AI_IMAGE_STORE });
    expect(await driver(false).read(new Uint8Array(1), "image/png")).toEqual({
      trust: ContentCredentialTrust.Unverified,
      credential: RECORDED,
    });
  });

  it("is trusted only when the engine vouches for the signer", async () => {
    const vouched = {
      validation_state: "Trusted",
      validation_results: {
        activeManifest: {
          success: [{ code: "signingCredential.trusted" }, { code: "claimSignature.validated" }],
          failure: [],
        },
      },
    };
    engineReads(vouched);
    expect(await driver(false).read(new Uint8Array(1), "image/png")).toEqual({
      trust: ContentCredentialTrust.Trusted,
      credential: RECORDED,
    });
    // A Trusted state without the signer's success code is not enough.
    engineReads({ ...vouched, validation_results: { activeManifest: { success: [] } } });
    expect(await driver(false).read(new Uint8Array(1), "image/png")).toMatchObject({
      trust: ContentCredentialTrust.Unverified,
    });
  });

  it("is invalid, with no claim, when the store does not verify", async () => {
    engineReads({
      validation_state: "Invalid",
      validation_status: [{ code: "assertion.dataHash.mismatch" }],
    });
    expect(await driver(false).read(new Uint8Array(1), "image/png")).toEqual({
      trust: ContentCredentialTrust.Invalid,
    });
  });

  it("is null when the engine finds no manifest, or one that states no credential", async () => {
    engine.fromAsset.mockRejectedValueOnce(new Error("JumbfNotFound"));
    expect(await driver().read(new Uint8Array(1), "image/png")).toBeNull();
    engine.fromAsset.mockResolvedValueOnce(null);
    expect(await driver().read(new Uint8Array(1), "image/png")).toBeNull();
    engineReads({ active_manifest: undefined });
    expect(await driver().read(new Uint8Array(1), "image/png")).toBeNull();
  });

  it("reads with the pinned trust list and our signers, never fetching a remote manifest or OCSP", async () => {
    const current = c2paTestCertificate();
    const earlier = c2paTestCertificate();
    engine.fromAsset.mockResolvedValueOnce(null);
    await driver(true, "", current, [earlier.certificate]).read(new Uint8Array(1), "image/png");
    const settings = readSettings();
    expect(settings.verify).toEqual({
      verifyTrust: true,
      verifyTimestampTrust: true,
      verifyAfterReading: true,
      ocspFetch: false,
      remoteManifestFetch: false,
    });
    // Every anchor of the pinned list valid now, and nothing else.
    const now = new Date();
    const valid = certificates(C2PA_TRUST_LIST)
      .filter(({ validFromDate, validToDate }) => validFromDate <= now && now <= validToDate)
      .map(({ fingerprint256 }) => fingerprint256);
    expect(valid.length).toBeGreaterThan(0);
    expect(fingerprints(settings.trust?.trustAnchors)).toEqual(valid);
    // Our signers are the end-entity certificates of the signing chain and of the earlier one, never their CAs.
    expect(fingerprints(settings.trust?.allowedList)).toEqual([
      fingerprints(current.certificate)[0],
      fingerprints(earlier.certificate)[0],
    ]);
  });

  it("drops an expired signer from the allowed list", async () => {
    const signing = c2paTestCertificate();
    // The test certificates are valid for one day either side of now.
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 2 * 86_400_000 });
    engine.fromAsset.mockResolvedValueOnce(null);
    await driver(true, "", signing).read(new Uint8Array(1), "image/png");
    expect(readSettings().trust?.allowedList).toBeUndefined();
  });

  it("fails closed with an empty, unreadable or expired trust list: never trusted", async () => {
    const vouched = {
      validation_state: "Trusted",
      validation_results: { activeManifest: { success: [{ code: "signingCredential.trusted" }] } },
    };
    // The test CA, which expires a day from now (the signing chain's second certificate).
    const anchor = certificates(c2paTestCertificate().certificate)[1]?.toString() ?? "";
    const lists: { readonly list: () => string; readonly later?: true }[] = [
      { list: () => "" },
      { list: () => "-----BEGIN CERTIFICATE-----\nnot a certificate\n-----END CERTIFICATE-----\n" },
      {
        list: () => {
          throw new Error("unreadable");
        },
      },
      { list: () => anchor, later: true },
    ];
    for (const { list, later } of lists) {
      if (later === true) vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 2 * 86_400_000 });
      engineReads(vouched);
      expect(await withList(list).read(new Uint8Array(1), "image/png")).toEqual({
        trust: ContentCredentialTrust.Unverified,
        credential: RECORDED,
      });
      // The engine got no anchor at all, so its own answer could not have been trusted either.
      expect(readSettings().trust).toBeUndefined();
      vi.useRealTimers();
    }
  });
});
