/**
 * Stackra file contract:
 * Purpose: the AES-GCM driver of the `FieldCipher` port (driver name `aes-gcm`): seals a field with AES-256-GCM under
 *          the `KeyProvider`'s current data key, a fresh 96-bit IV per seal and the context as additional data, as
 *          `v1.<keyId>.<iv>.<ciphertext>` (base64url); opens with the key the sealed form names.
 * Boundary: a plain subclass of the port (this package sits below @stackra/container). Web Crypto only, so it runs in
 *           a service, a Worker and a browser. The context is authenticated, not stored: a value sealed for one
 *           `table.column` fails to open in another. Imported keys are cached per id in memory and never exported. A
 *           tampered, truncated or foreign value is refused with an Error that names no value.
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2: data keys per environment and tenant); ADR 0173 (nobody reads a value);
 *                     registry gaps R-27 and R-36 (owner decision 23).
 */
import { base64urlDecode as decode } from "#core/functions/base64url-decode.function";
import { base64urlEncode as encode } from "#core/functions/base64url-encode.function";
import { FieldCipher } from "#core/ports/field-cipher.port";
import type { KeyProvider } from "#core/ports/key-provider.port";

/** The sealed form's version tag. */
const VERSION = "v1";

/** The IV length AES-GCM is specified for: 12 bytes. */
const IV_BYTES = 12;

/**
 * Seals fields with AES-256-GCM.
 *
 * @example
 * const cipher = new AesGcmFieldCipherDriver(keys);
 * const sealed = await cipher.seal("+966500000000", "parties.phone");
 */
export class AesGcmFieldCipherDriver extends FieldCipher {
  private readonly keys: KeyProvider;

  private readonly imported = new Map<string, Promise<CryptoKey>>();

  /**
   * @param keys - the data keys to seal with and open with.
   */
  constructor(keys: KeyProvider) {
    super();
    this.keys = keys;
  }

  /** The sealed form of `plain`, bound to `context`. */
  async seal(plain: string, context: string): Promise<string> {
    const { id } = await this.keys.current();
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const sealed = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(context) },
      await this.cryptoKey(id),
      new TextEncoder().encode(plain),
    );
    return [VERSION, id, encode(iv), encode(new Uint8Array(sealed))].join(".");
  }

  /** The plain text of `sealed`. */
  async open(sealed: string, context: string): Promise<string> {
    const [version, id, iv, body, ...rest] = sealed.split(".");
    if (
      version !== VERSION ||
      id === undefined ||
      iv === undefined ||
      body === undefined ||
      rest.length > 0
    )
      throw new Error("The sealed value is malformed");
    let plain: ArrayBuffer;
    try {
      plain = await globalThis.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: decode(iv), additionalData: new TextEncoder().encode(context) },
        await this.cryptoKey(id),
        decode(body),
      );
    } catch {
      throw new Error("The sealed value cannot be opened in this context");
    }
    return new TextDecoder().decode(plain);
  }

  /** The imported AES key of data key `id`. */
  private cryptoKey(id: string): Promise<CryptoKey> {
    let key = this.imported.get(id);
    if (key === undefined) {
      key = this.keys
        .byId(id)
        .then((data) =>
          globalThis.crypto.subtle.importKey("raw", new Uint8Array(data.key), "AES-GCM", false, [
            "encrypt",
            "decrypt",
          ]),
        );
      // A failed lookup is not cached, so a key added after a rotation is found next time.
      key.catch(() => this.imported.delete(id));
      this.imported.set(id, key);
    }
    return key;
  }
}
