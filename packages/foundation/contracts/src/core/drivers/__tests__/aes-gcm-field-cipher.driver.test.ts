/**
 * Stackra file contract:
 * Purpose: unit tests of `AesGcmFieldCipherDriver`: it is the `FieldCipher` port; a sealed value names its key, hides
 *          the plain text, differs on every seal and opens in its own context only; a value sealed before a rotation
 *          still opens; a tampered, malformed or unknown-key value is refused without echoing it.
 * Boundary: test only; real Web Crypto over random test keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (decision 2); ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { AesGcmFieldCipherDriver } from "#core/drivers/aes-gcm-field-cipher.driver";
import { MemoryKeyProviderDriver } from "#core/drivers/memory-key-provider.driver";
import { FieldCipher } from "#core/ports/field-cipher.port";

const key = () => globalThis.crypto.getRandomValues(new Uint8Array(32));

describe("AesGcmFieldCipherDriver", () => {
  it("seals with the current key and opens in the same context only", async () => {
    const cipher = new AesGcmFieldCipherDriver(
      new MemoryKeyProviderDriver([{ id: "k1", key: key() }]),
    );
    expect(cipher).toBeInstanceOf(FieldCipher);
    const sealed = await cipher.seal("canary-plain", "parties.phone");
    expect(sealed.startsWith("v1.k1.")).toBe(true);
    expect(sealed).not.toContain("canary-plain");
    expect(await cipher.seal("canary-plain", "parties.phone")).not.toBe(sealed);
    expect(await cipher.open(sealed, "parties.phone")).toBe("canary-plain");
    await expect(cipher.open(sealed, "parties.email")).rejects.toThrow(/cannot be opened/);
  });

  it("opens a value sealed before a rotation", async () => {
    const first = { id: "k1", key: key() };
    const before = await new AesGcmFieldCipherDriver(new MemoryKeyProviderDriver([first])).seal(
      "old",
      "c",
    );
    const rotated = new AesGcmFieldCipherDriver(
      new MemoryKeyProviderDriver([first, { id: "k2", key: key() }]),
    );
    expect(await rotated.open(before, "c")).toBe("old");
    expect((await rotated.seal("new", "c")).startsWith("v1.k2.")).toBe(true);
  });

  it("refuses tampered, malformed and unknown-key values without echoing them", async () => {
    const cipher = new AesGcmFieldCipherDriver(
      new MemoryKeyProviderDriver([{ id: "k1", key: key() }]),
    );
    const sealed = await cipher.seal("x", "c");
    const parts = sealed.split(".");
    const tampered = [...parts.slice(0, 3), `${parts[3]?.slice(0, -2)}AA`].join(".");
    await expect(cipher.open(tampered, "c")).rejects.toThrow(/cannot be opened/);
    await expect(cipher.open("v2.k1.a.b", "c")).rejects.toThrow(/malformed/);
    await expect(cipher.open("v1.k1.a", "c")).rejects.toThrow(/malformed/);
    await expect(cipher.open(sealed.replace("v1.k1.", "v1.k9."), "c")).rejects.not.toThrow(sealed);
  });
});
