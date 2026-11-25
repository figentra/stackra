/**
 * Stackra file contract:
 * Purpose: the real C2PA round trip of `C2paContentCredentialsDriver` on the c2pa-rs engine itself (no stand-in):
 *          sign a PNG with a certificate made for the run, embed the manifest, read it back, verify it, and refuse the
 *          credential once the signed image changes.
 * Boundary: test only; in process, no file and no network (no time-stamp authority). The certificate and key are made
 *           by `c2paTestCertificate()` when the suite starts and never leave memory. `@contentauth/c2pa-node` ships
 *           its binding for Linux x64 only, and its postinstall (which fetches the others) is off (`allowBuilds`), so
 *           the suite must run on Linux x64 (CI) and fails there if the binding does not load; on any other platform
 *           it is skipped with the reason.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0173; COM-73, COM-294; STA-789; STA-2781.
 */
import { deflateSync, inflateSync } from "node:zlib";

import { LocalSigner, Reader } from "@contentauth/c2pa-node";
import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { MediaConfig } from "#config/media.config";
import { c2paTestCertificate } from "#node/drivers/__tests__/c2pa-test-certificate.fixture";
import { pngChunk } from "#node/drivers/__tests__/png-chunk.fixture";
import { testPng } from "#node/drivers/__tests__/test-png.fixture";
import { C2paContentCredentialsDriver } from "#node/drivers/c2pa-content-credentials.driver";

/** Linux x64: the platform whose binding the package ships, so the round trip must run there. */
const REQUIRED = process.platform === "linux" && process.arch === "x64";

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

/** The driver, signing with `signing`; without it, it can only read. */
function driver(signing?: C2paTestCertificate): C2paContentCredentialsDriver {
  const secrets = new MemorySecretStoreDriver();
  if (signing !== undefined)
    secrets
      .set("MEDIA_C2PA_SIGNING_CERTIFICATE", signing.certificate)
      .set("MEDIA_C2PA_SIGNING_KEY", signing.key);
  return new C2paContentCredentialsDriver(
    buildConfig(MediaConfig, {
      values: { c2pa: { algorithm: "es256", timestampUrl: "", formats: ["image/png"] } },
      secrets,
    }),
  );
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

  it("reads the signed credential back, verified, with a driver that holds no key", async () => {
    expect(await driver().read(signed, "image/png")).toEqual(credential);
    // c2pa-rs validated the claim signature and the hash of every byte outside the manifest; the test CA is on no
    // trust list, so the store is Valid, not Trusted.
    const store = (
      await Reader.fromAsset({ buffer: Buffer.from(signed), mimeType: "image/png" })
    )?.json() as
      | {
          validation_state?: string;
          validation_results?: { activeManifest?: { success?: { code: string }[] } };
        }
      | undefined;
    expect(store?.validation_state).toBe("Valid");
    expect(store?.validation_results?.activeManifest?.success?.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["claimSignature.validated", "assertion.dataHash.match"]),
    );
  });

  it("states a human-made image as not AI-generated", async () => {
    const human = { ...credential, aiGenerated: false };
    const signedHuman = await driver(signing).attach(testPng(8), "image/png", human);
    expect(await driver().read(signedHuman, "image/png")).toEqual(human);
  });

  it("has no credential once the signed image changes", async () => {
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
    expect(await driver().read(new Uint8Array(tampered), "image/png")).toBeNull();
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
