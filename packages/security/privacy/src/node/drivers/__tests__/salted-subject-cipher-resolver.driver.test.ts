/**
 * Stackra file contract:
 * Purpose: unit tests of `SaltedSubjectCipherResolverDriver`: a value sealed for a subject opens with that subject's
 *          cipher and not another's or the scope's; the first seal creates the salt; once the salt is destroyed the
 *          subject has no opening cipher, so the value is shredded.
 * Boundary: test only; the memory key provider and the memory salt store, real AES-GCM through Web Crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (crypto-shredding); gap gov2 (stackra-263).
 */
import { AesGcmFieldCipherDriver, MemoryKeyProviderDriver } from "@stackra/contracts";
import { SubjectCipherResolver } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { MemorySubjectSaltStoreDriver } from "#core/drivers/memory-subject-salt-store.driver";
import { SaltedSubjectCipherResolverDriver } from "#node/drivers/salted-subject-cipher-resolver.driver";

/** The column context every value below is sealed in. */
const CONTEXT = "crm.customer.name";

/** A resolver over one fixed scope key and a fresh salt store. */
function resolverOf() {
  const keys = new MemoryKeyProviderDriver([
    { id: "k1", key: globalThis.crypto.getRandomValues(new Uint8Array(32)) },
  ]);
  const salts = new MemorySubjectSaltStoreDriver();
  return { keys, salts, resolver: new SaltedSubjectCipherResolverDriver(keys, salts) };
}

describe(SaltedSubjectCipherResolverDriver, () => {
  it("seals under the subject's own key and creates the salt on the first seal", async () => {
    const { keys, salts, resolver } = resolverOf();
    expect(resolver).toBeInstanceOf(SubjectCipherResolver);
    expect(salts.has("usr_1")).toBe(false);

    const sealed = await (await resolver.sealing("usr_1")).seal("Hala", CONTEXT);
    expect(salts.has("usr_1")).toBe(true);
    expect(await (await resolver.opening("usr_1"))?.open(sealed, CONTEXT)).toBe("Hala");

    await resolver.sealing("usr_2");
    await expect((await resolver.opening("usr_2"))?.open(sealed, CONTEXT)).rejects.toThrow();
    await expect(new AesGcmFieldCipherDriver(keys).open(sealed, CONTEXT)).rejects.toThrow();
  });

  it("has no opening cipher once the subject's salt is destroyed", async () => {
    const { salts, resolver } = resolverOf();
    await (await resolver.sealing("usr_1")).seal("Hala", CONTEXT);

    await salts.destroy("usr_1");
    await expect(resolver.opening("usr_1")).resolves.toBeUndefined();
  });
});
