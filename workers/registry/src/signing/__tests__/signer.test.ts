/**
 * Stackra file contract:
 * Purpose: unit tests of the signer: signatures over `<name>@<version>:<integrity>` verify with node:crypto against
 *          the listed SPKI key, the keyid is npm's `SHA256:` form, rotated keys stay listed with their expiry, and
 *          `p1363ToDer` encodes high-bit and zero-led integers.
 * Boundary: pure Web Crypto; keys generated per test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decision 9).
 */
import { createHash, createPublicKey, generateKeyPairSync, verify } from "node:crypto";

import { createSigner } from "#src/signing/create-signer";
import { p1363ToDer } from "#src/signing/p1363-to-der";

const newPem = () =>
  generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

describe("createSigner", () => {
  it("signs in npm's registry-signature format", async () => {
    const signer = await createSigner(newPem(), "2027-10-27T00:00:00.000Z", []);
    const [key] = signer.keys();
    const spki = Buffer.from(key?.key ?? "", "base64");
    expect(key).toEqual(
      expect.objectContaining({
        expires: "2027-10-27T00:00:00.000Z",
        keytype: "ecdsa-sha2-nistp256",
        keyid: `SHA256:${createHash("sha256").update(spki).digest("base64").replace(/=+$/, "")}`,
      }),
    );
    const { keyid, sig } = await signer.sign("@stackra/core", "1.0.0", "sha512-abc");
    expect(keyid).toBe(key?.keyid);
    const publicKey = createPublicKey({ key: spki, format: "der", type: "spki" });
    expect(
      verify(
        "sha256",
        Buffer.from("@stackra/core@1.0.0:sha512-abc"),
        publicKey,
        Buffer.from(sig, "base64"),
      ),
    ).toBe(true);
  });

  it("keeps rotated keys listed", async () => {
    const old = await createSigner(newPem(), null, []);
    const oldKey = old.keys()[0];
    const signer = await createSigner(newPem(), null, [
      { key: oldKey?.key ?? "", expires: "2026-10-27T00:00:00.000Z" },
    ]);
    expect(signer.keys().map((key) => [key.keyid, key.expires])).toEqual([
      [signer.keys()[0]?.keyid, null],
      [oldKey?.keyid, "2026-10-27T00:00:00.000Z"],
    ]);
  });
});

describe("p1363ToDer", () => {
  it("pads a high-bit integer and strips leading zeros", () => {
    const raw = new Uint8Array(64);
    raw[0] = 0x80;
    raw[63] = 0x01;
    const der = p1363ToDer(raw);
    expect([...der.subarray(0, 5)]).toEqual([0x30, 0x26, 0x02, 0x21, 0x00]);
    expect([...der.subarray(-3)]).toEqual([0x02, 0x01, 0x01]);
  });
});
