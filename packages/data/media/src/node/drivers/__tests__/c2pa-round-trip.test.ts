/**
 * Stackra file contract:
 * Purpose: the real C2PA round trip of `C2paContentCredentialsDriver` on the c2pa-rs engine itself (no stand-in):
 *          sign a PNG with a certificate made for the run, embed the manifest, read it back and verify it, and say
 *          how far it is trusted: `trusted` for our own signer (the configured signing certificate or a
 *          `trustedSigners` one) or a signer that chains to a trust-list anchor; `unverified` for a self-made CA,
 *          an empty trust list or an expired anchor; `invalid` once the signed image changes.
 * Boundary: test only; in process, no file and no network (no time-stamp authority). The certificate and key are made
 *           by `c2paTestCertificate()` when the suite starts and never leave memory. `@contentauth/c2pa-node` ships
 *           its binding for Linux x64 only, and its postinstall (which fetches the others) is off (`allowBuilds`), so
 *           the suite must run on Linux x64 (CI) and fails there if the binding does not load; on any other platform
 *           it is skipped with the reason, unless `C2PA_ROUND_TRIP_REQUIRED=1` (set where a merge is gated), which turns
 *           that skip into a failure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173; COM-73, COM-294; STA-789; STA-2781; STA-2791 (CTO decision of 2026-11-25).
 */
import { deflateSync, inflateSync } from "node:zlib";

import { LocalSigner, Reader } from "@contentauth/c2pa-node";
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MediaConfig } from "#config/media.config";
import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import { c2paTestCertificate } from "#node/drivers/__tests__/c2pa-test-certificate.fixture";
import { pngChunk } from "#node/drivers/__tests__/png-chunk.fixture";
import { testPng } from "#node/drivers/__tests__/test-png.fixture";
import { C2paContentCredentialsDriver } from "#node/drivers/c2pa-content-credentials.driver";

/**
 * Linux x64 (the platform whose binding the package ships) or `C2PA_ROUND_TRIP_REQUIRED=1`: the round trip must run,
 * and a binding that does not load fails the suite instead of skipping it.
 */
const REQUIRED =
  (process.platform === "linux" && process.arch === "x64") ||
  process.env.C2PA_ROUND_TRIP_REQUIRED === "1";

/** Why the engine's binding does not load here, or `null` when it does (it always must on Linux x64). */
function bindingUnavailable(): string | null {
  const { certificate, key } = c2paTestCertificate();
  try {
    LocalSigner.newSigner(Buffer.from(certificate), Buffer.from(key), "es256");
    return null;
  } catch (error) {
    if (REQUIRED) throw error;
    // The loader's code (ERR_DLOPEN_FAILED for a binding built for another platform), not its long path list.
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : String(error).slice(0, 80);
  }
}

const unavailable = bindingUnavailable();
/** The suite's name; off Linux x64 it carries the reason it is skipped, which the test report shows. */
const SUITE =
  unavailable === null
    ? "C2paContentCredentialsDriver on c2pa-rs (round trip)"
    : `C2paContentCredentialsDriver on c2pa-rs (round trip): skipped on ${process.platform}-${process.arch}, the binding does not load (${unavailable})`;

const credential = {
  generator: "figentra-ai/1.4 (image model)",
  aiGenerated: true,
  createdAt: new Date("2026-11-25T08:30:00.000Z"),
};

/** The signing certificate chain and key `c2paTestCertificate()` makes. */
type C2paTestCertificate = ReturnType<typeof c2paTestCertificate>;

/** The test certificates are valid for one day either side of now: two days on, every one has expired. */
const AFTER_EXPIRY = 2 * 86_400_000;

/** The configuration: signing with `signing` (without it, the driver can only read), trusting `trustedSigners`. */
function configOf(signing?: C2paTestCertificate, trustedSigners: string[] = []): MediaConfig {
  const secrets = new MemorySecretStoreDriver();
  if (signing !== undefined)
    secrets
      .set("MEDIA_C2PA_SIGNING_CERTIFICATE", signing.certificate)
      .set("MEDIA_C2PA_SIGNING_KEY", signing.key);
  return buildConfig(MediaConfig, {
    values: {
      c2pa: { algorithm: "es256", timestampUrl: "", formats: ["image/png"], trustedSigners },
    },
    secrets,
  });
}

/** The driver, signing with `signing`; without it, it can only read. */
function driver(
  signing?: C2paTestCertificate,
  trustedSigners: string[] = [],
): C2paContentCredentialsDriver {
  return new C2paContentCredentialsDriver(configOf(signing, trustedSigners));
}

/** A reading driver whose trust list is `pem` instead of the pinned C2PA list, and which signs with nothing. */
function trustingOnly(pem: string): C2paContentCredentialsDriver {
  return new (class extends C2paContentCredentialsDriver {
    protected override trustList(): string {
      return pem;
    }
  })(configOf());
}

/** The CA certificate (PEM) of a test signing chain: its second certificate. */
function authorityOf({ certificate }: C2paTestCertificate): string {
  const [, authority] = certificate.match(
    /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----\n/g,
  ) ?? [""];
  return authority ?? "";
}

/** Where the first PNG chunk of `type` starts in `png` (its length field), and its data. */
function chunkOf(png: Uint8Array, type: string): { readonly start: number; readonly data: Buffer } {
  const view = Buffer.from(png.buffer, png.byteOffset, png.byteLength);
  for (let start = 8; start + 8 <= view.length;) {
    const length = view.readUInt32BE(start);
    if (view.toString("ascii", start + 4, start + 8) === type)
      return { start, data: view.subarray(start + 8, start + 8 + length) };
    start += 12 + length;
  }
  throw new Error(`No ${type} chunk`);
}

afterEach(() => {
  vi.useRealTimers();
});

describe.skipIf(unavailable !== null)(SUITE, () => {
  const size = 16;
  let signing: C2paTestCertificate;
  let original: Uint8Array;
  let signed: Uint8Array;

  beforeAll(async () => {
    signing = c2paTestCertificate();
    original = testPng(size);
    signed = await driver(signing).attach(original, "image/png", credential);
  });

  it("embeds a manifest store in the image and keeps its pixels", () => {
    expect(signed.byteLength).toBeGreaterThan(original.byteLength);
    // c2pa-rs stores the manifest store in a `caBX` chunk; the image data is untouched.
    expect(chunkOf(signed, "caBX").data.byteLength).toBeGreaterThan(0);
    expect(chunkOf(signed, "IDAT").data).toEqual(chunkOf(original, "IDAT").data);
  });

  it("trusts our own signer: the configured signing certificate", async () => {
    expect(await driver(signing).read(signed, "image/png")).toEqual({
      trust: ContentCredentialTrust.Trusted,
      credential,
    });
  });

  it("trusts an earlier signing certificate kept in trustedSigners, with no key", async () => {
    expect(await driver(undefined, [signing.certificate]).read(signed, "image/png")).toEqual({
      trust: ContentCredentialTrust.Trusted,
      credential,
    });
  });

  it("gives a self-made CA unverified: the claims, never trusted", async () => {
    // The test CA is on no trust list: c2pa-rs validated the claim signature and the hash of every byte outside the
    // manifest, so the store is Valid, but its signer chains to no anchor.
    const store = (
      await Reader.fromAsset({ buffer: Buffer.from(signed), mimeType: "image/png" })
    )?.json() as
      | {
          validation_state?: string;
          validation_results?: {
            activeManifest?: { success?: { code: string }[]; failure?: { code: string }[] };
          };
        }
      | undefined;
    expect(store?.validation_state).toBe("Valid");
    expect(store?.validation_results?.activeManifest?.success?.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["claimSignature.validated", "assertion.dataHash.match"]),
    );
    expect(store?.validation_results?.activeManifest?.failure?.map(({ code }) => code)).toEqual([
      "signingCredential.untrusted",
    ]);
    // A reader that holds no key, and one that signs with another certificate, trust only the pinned list and
    // their own signers.
    for (const reader of [driver(), driver(c2paTestCertificate())])
      expect(await reader.read(signed, "image/png")).toEqual({
        trust: ContentCredentialTrust.Unverified,
        credential,
      });
  });

  it("trusts a signer that chains to a trust-list anchor, until the anchor expires", async () => {
    const reader = trustingOnly(authorityOf(signing));
    expect(await reader.read(signed, "image/png")).toEqual({
      trust: ContentCredentialTrust.Trusted,
      credential,
    });
    // Fail closed: an expired anchor is no anchor, whatever the engine's clock says.
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + AFTER_EXPIRY });
    expect(await reader.read(signed, "image/png")).toEqual({
      trust: ContentCredentialTrust.Unverified,
      credential,
    });
  });

  it("gives unverified with an empty or unreadable trust list, even for our own signer", async () => {
    for (const pem of ["", "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----\n"]) {
      const reader = new (class extends C2paContentCredentialsDriver {
        protected override trustList(): string {
          return pem;
        }
      })(configOf(signing));
      expect(await reader.read(signed, "image/png")).toEqual({
        trust: ContentCredentialTrust.Unverified,
        credential,
      });
    }
  });

  it("states a human-made image as not AI-generated", async () => {
    const human = { ...credential, aiGenerated: false };
    const signedHuman = await driver(signing).attach(testPng(8), "image/png", human);
    expect(await driver(signing).read(signedHuman, "image/png")).toEqual({
      trust: ContentCredentialTrust.Trusted,
      credential: human,
    });
  });

  it("gives invalid, with no claim, once the signed image changes", async () => {
    // Another picture: every pixel inverted (each row's filter byte kept) and its chunk CRC written again, so the PNG
    // is still valid and only the C2PA hash binding can tell.
    const { start, data } = chunkOf(signed, "IDAT");
    const rowLength = 1 + size * 3;
    const inverted = inflateSync(data).map((byte, index) =>
      index % rowLength === 0 ? byte : 255 - byte,
    );
    const view = Buffer.from(signed.buffer, signed.byteOffset, signed.byteLength);
    const tampered = Buffer.concat([
      view.subarray(0, start),
      pngChunk("IDAT", deflateSync(inverted)),
      view.subarray(start + 12 + data.byteLength),
    ]);
    // Even for our own signer: the hash binding, not the signer, decides.
    expect(await driver(signing).read(new Uint8Array(tampered), "image/png")).toEqual({
      trust: ContentCredentialTrust.Invalid,
    });
    // Refused by the hash binding, not because the engine could not parse the image.
    const store = (await Reader.fromAsset({ buffer: tampered, mimeType: "image/png" }))?.json() as
      | { validation_state?: string; validation_status?: { code: string }[] }
      | undefined;
    expect(store?.validation_state).toBe("Invalid");
    expect(store?.validation_status?.map(({ code }) => code)).toContain(
      "assertion.dataHash.mismatch",
    );
  });

  it("has no credential on an image that was never signed", async () => {
    expect(await driver().read(original, "image/png")).toBeNull();
  });
});
