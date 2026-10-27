/**
 * Stackra file contract:
 * Purpose: unit tests of `SubjectKeyProviderDriver`: a subject's key keeps the tenant key's id, differs from the
 *          tenant key and from another subject's key, is stable for the same salt, follows a rotation, and a value
 *          sealed for one subject does not open under another subject's key or a new salt (erasure); a short salt or
 *          an empty subject id is refused.
 * Boundary: test only; real Web Crypto over random keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0212; ADR 0415.
 */
import { describe, expect, it } from "@stackra/testing";

import { AesGcmFieldCipherDriver } from "#core/drivers/aes-gcm-field-cipher.driver";
import { MemoryKeyProviderDriver } from "#core/drivers/memory-key-provider.driver";
import { SubjectKeyProviderDriver } from "#core/drivers/subject-key-provider.driver";

const random = (length: number) => crypto.getRandomValues(new Uint8Array(length));

describe("SubjectKeyProviderDriver", () => {
  const scopeKeys = new MemoryKeyProviderDriver([
    { id: "k1", key: random(32) },
    { id: "k2", key: random(32) },
  ]);

  it("derives a stable key per subject under the tenant key's id", async () => {
    const salt = random(32);
    const sara = await new SubjectKeyProviderDriver(scopeKeys, "usr_a", salt).current();
    const again = await new SubjectKeyProviderDriver(scopeKeys, "usr_a", salt).current();
    const omar = await new SubjectKeyProviderDriver(scopeKeys, "usr_b", salt).current();
    expect(sara.id).toBe("k2");
    expect(sara.key).toEqual(again.key);
    expect(sara.key).not.toEqual(omar.key);
    expect(sara.key).not.toEqual((await scopeKeys.current()).key);
    expect((await new SubjectKeyProviderDriver(scopeKeys, "usr_a", salt).byId("k1")).id).toBe("k1");
  });

  it("opens a subject's data only under that subject's salt", async () => {
    const salt = random(16);
    const sealed = await new AesGcmFieldCipherDriver(
      new SubjectKeyProviderDriver(scopeKeys, "usr_a", salt),
    ).seal("canary", "c");
    expect(
      await new AesGcmFieldCipherDriver(
        new SubjectKeyProviderDriver(scopeKeys, "usr_a", salt),
      ).open(sealed, "c"),
    ).toBe("canary");
    await expect(
      new AesGcmFieldCipherDriver(
        new SubjectKeyProviderDriver(scopeKeys, "usr_a", random(16)),
      ).open(sealed, "c"),
    ).rejects.toThrow();
    await expect(
      new AesGcmFieldCipherDriver(new SubjectKeyProviderDriver(scopeKeys, "usr_b", salt)).open(
        sealed,
        "c",
      ),
    ).rejects.toThrow();
  });

  it("refuses a short salt and an empty subject", () => {
    expect(() => new SubjectKeyProviderDriver(scopeKeys, "usr_a", random(15))).toThrow(RangeError);
    expect(() => new SubjectKeyProviderDriver(scopeKeys, "", random(16))).toThrow(RangeError);
  });
});
