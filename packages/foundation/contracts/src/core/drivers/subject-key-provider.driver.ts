/**
 * Stackra file contract:
 * Purpose: the per-subject driver of the `KeyProvider` port (driver name `subject`): a key per data subject derived
 *          from the tenant's data key with HKDF-SHA-256 over the subject's own random salt, so one person's records
 *          are sealed under a key of their own, and destroying that salt (erasure) makes them unreadable while the
 *          tenant key and everyone else's data stay intact.
 * Boundary: a plain subclass of the port that wraps any tenant `KeyProvider` (memory, `aws-kms`). The derived key
 *           keeps the tenant key's id, so rotation of the tenant key carries through and a sealed form still names
 *           the right tenant key. The salt is stored by the caller beside the subject (at least 16 random bytes);
 *           this driver neither stores nor logs it. The info string binds the key to the subject id.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2); ADR 0212 (crypto-shredding of an erased subject); ADR 0415 (decision 3).
 */
import { KeyProvider } from "#core/ports/key-provider.port";
import type { DataKey } from "#core/types/data-key.type";

/** The shortest salt accepted: 128 bits. */
const SALT_BYTES = 16;

/**
 * Derives a subject's keys from the tenant's.
 *
 * @example
 * const salt = subjectRow.salt ?? crypto.getRandomValues(new Uint8Array(32)); // stored with the subject
 * const cipher = new AesGcmFieldCipherDriver(new SubjectKeyProviderDriver(tenantKeys, "usr_01j9…", salt));
 */
export class SubjectKeyProviderDriver extends KeyProvider {
  private readonly tenant: KeyProvider;

  private readonly info: Uint8Array<ArrayBuffer>;

  private readonly salt: Uint8Array<ArrayBuffer>;

  /**
   * @param tenant - the tenant's key provider.
   * @param subjectId - the data subject's id; bound into every derived key.
   * @param salt - the subject's random salt, at least 16 bytes; copied.
   * @throws RangeError when the subject id is empty or the salt is short.
   */
  constructor(tenant: KeyProvider, subjectId: string, salt: Uint8Array) {
    super();
    if (subjectId === "") throw new RangeError("SubjectKeyProviderDriver needs a subject id");
    if (salt.length < SALT_BYTES)
      throw new RangeError(`A subject salt is at least ${SALT_BYTES} bytes, got ${salt.length}`);
    this.tenant = tenant;
    this.info = new TextEncoder().encode(`stackra:subject:${subjectId}`);
    this.salt = new Uint8Array(salt);
  }

  /** See `KeyProvider.current`. */
  async current(): Promise<DataKey> {
    return this.derive(await this.tenant.current());
  }

  /** See `KeyProvider.byId`. */
  async byId(id: string): Promise<DataKey> {
    return this.derive(await this.tenant.byId(id));
  }

  /** The subject's key under tenant key `base`. */
  private async derive(base: DataKey): Promise<DataKey> {
    const material = await globalThis.crypto.subtle.importKey(
      "raw",
      new Uint8Array(base.key),
      "HKDF",
      false,
      ["deriveBits"],
    );
    const bits = await globalThis.crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: this.salt, info: this.info },
      material,
      256,
    );
    return Object.freeze({ id: base.id, key: new Uint8Array(bits) });
  }
}
