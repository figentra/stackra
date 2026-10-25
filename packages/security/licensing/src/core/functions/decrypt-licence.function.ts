/**
 * Stackra file contract:
 * Purpose: `decryptLicence`, opens the `enc` of an `aes-256-gcm+ed25519` licence file: `<ciphertext>.<iv>.<tag>`, each
 *          base64, sealed with AES-256-GCM under the SHA-256 of the licence key (Keygen's scheme).
 * Boundary: internal; not exported from the entry. Called only after the signature verified (Keygen signs the sealed
 *           text). Refuses with `LicenceFileInvalidError`: `licence_key_required` without a key, `malformed` for a bad
 *           shape, `decryption_failed` when the key does not open it. The key is never kept or put in a refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decisions 1 and 2).
 */
import { LicenceFileInvalidError } from "#core/errors/licence-file-invalid.error";
import { decodeBase64 } from "#core/functions/decode-base64.function";

/**
 * Decrypts an encrypted licence file's dataset.
 *
 * @example
 * const dataset = await decryptLicence(certificate.enc, licenceKey);
 * @throws LicenceFileInvalidError as above.
 */
export async function decryptLicence(
  enc: string,
  licenceKey: string | undefined,
): Promise<Uint8Array<ArrayBuffer>> {
  if (licenceKey === undefined || licenceKey === "")
    throw LicenceFileInvalidError.create({ reason: "licence_key_required" });
  const parts = enc.split(".");
  if (parts.length !== 3) throw LicenceFileInvalidError.create({ reason: "malformed" });
  let ciphertext: Uint8Array<ArrayBuffer>;
  let iv: Uint8Array<ArrayBuffer>;
  let tag: Uint8Array<ArrayBuffer>;
  try {
    [ciphertext, iv, tag] = parts.map(decodeBase64) as [
      Uint8Array<ArrayBuffer>,
      Uint8Array<ArrayBuffer>,
      Uint8Array<ArrayBuffer>,
    ];
  } catch (error) {
    throw LicenceFileInvalidError.create({ reason: "malformed" }, { cause: error });
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(licenceKey));
  const key = await crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["decrypt"]);
  // Web Crypto takes the tag appended to the ciphertext.
  const sealed = new Uint8Array(ciphertext.length + tag.length);
  sealed.set(ciphertext);
  sealed.set(tag, ciphertext.length);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, sealed),
    );
  } catch (error) {
    throw LicenceFileInvalidError.create({ reason: "decryption_failed" }, { cause: error });
  }
}
