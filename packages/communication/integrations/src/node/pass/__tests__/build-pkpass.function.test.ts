/**
 * Stackra file contract:
 * Purpose: unit tests of `buildPkpass`: the signer signs the manifest of SHA-1 hashes at the signing time, the result
 *          is a zip holding the files, `manifest.json` and `signature`, and a caller cannot supply either of those.
 * Boundary: test only; the signer is an in-test driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { createHash } from "node:crypto";

import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { CmsSigner } from "#contracts/ports/cms-signer.port";
import { buildPkpass } from "#node/pass/build-pkpass.function";

class RecordingCmsSignerDriver extends Driver(CmsSigner) {
  calls: { content: string; signedAt: Date }[] = [];

  async sign(content: Uint8Array, signedAt: Date): Promise<Uint8Array> {
    this.calls.push({ content: new TextDecoder().decode(content), signedAt });
    return Uint8Array.of(0x30, 0x00);
  }
}

const passJson = new TextEncoder().encode('{"formatVersion":1}');
const icon = Uint8Array.of(1, 2, 3);
const at = new Date("2026-10-27T10:00:00Z");

describe("buildPkpass", () => {
  it("signs the manifest of SHA-1 hashes", async () => {
    const signer = new RecordingCmsSignerDriver();
    await buildPkpass({ "pass.json": passJson, "icon.png": icon }, signer, at);
    expect(signer.calls).toHaveLength(1);
    expect(signer.calls[0]?.signedAt).toBe(at);
    expect(JSON.parse(signer.calls[0]?.content ?? "")).toEqual({
      "pass.json": createHash("sha1").update(passJson).digest("hex"),
      "icon.png": createHash("sha1").update(icon).digest("hex"),
    });
  });

  it("zips the files, the manifest and the signature", async () => {
    const bytes = await buildPkpass(
      { "pass.json": passJson, "icon.png": icon },
      new RecordingCmsSignerDriver(),
      at,
    );
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const text = new TextDecoder("latin1").decode(bytes);
    for (const name of ["pass.json", "icon.png", "manifest.json", "signature"])
      expect(text).toContain(name);
  });

  it("refuses a manifest.json or signature from the caller", async () => {
    await expect(
      buildPkpass({ signature: icon }, new RecordingCmsSignerDriver(), at),
    ).rejects.toThrow(TypeError);
  });
});
