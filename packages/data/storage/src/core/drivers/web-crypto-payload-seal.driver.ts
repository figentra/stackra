/**
 * Stackra file contract:
 * Purpose: `WebCryptoPayloadSealDriver`, the `web_crypto` driver of `PayloadSeal`: AES-GCM with a 256-bit key minted
 *          on the first seal of a session and kept in the `secrets` area, a fresh 96-bit nonce per seal.
 * Boundary: runs wherever `crypto.subtle` exists (browsers, Electron, Node, Workers; React Native with a WebCrypto
 *           polyfill). The key is read from `secrets` on every call, so a wipe of that area makes every earlier
 *           payload unopenable at once; the imported key is cached only while the stored value is the same. Sealed
 *           text is `v1.<nonce>.<ciphertext>`, both base64; anything else, a tampered text or another key opens to
 *           `undefined`. On the web `secrets` lives in memory, so a reload starts a new key and an older payload reads
 *           as absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 2); ADR 0256 (the web keeps secrets behind WebCrypto); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import type { Storage } from "#contracts/ports/storage.port";
import { PAYLOAD_KEY } from "#core/constants/payload-key.constant";

/** The format tag of a sealed text. */
const VERSION = "v1";

/** `bytes` as base64; a loop, because spreading a large payload overflows the call stack. */
function base64Of(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** The bytes of the base64 `text`. */
function bytesOf(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * The platform's `SubtleCrypto`.
 *
 * @throws Error when the platform has none.
 */
function subtle(): SubtleCrypto {
  const found = globalThis.crypto?.subtle;
  if (found === undefined)
    throw new Error("PayloadSeal web_crypto needs crypto.subtle on this platform");
  return found;
}

/**
 * Seals payloads with AES-GCM.
 *
 * @example
 * drivers: [{ port: PayloadSeal, candidates: { web: () => WebCryptoPayloadSealDriver } }]
 */
export class WebCryptoPayloadSealDriver extends Driver(PayloadSeal) {
  /** AES-GCM: the sealed text alone reveals nothing. */
  readonly isEncrypting = true;

  private readonly storage: Storage;

  /** The last imported key and the stored value it came from. */
  private imported: { readonly raw: string; readonly key: Promise<CryptoKey> } | undefined;

  /**
   * @param storage - holds the key in its `secrets` area.
   */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /**
   * Seals `text` with the session's key, minting it first when `secrets` holds none.
   *
   * @throws Error when the platform has no `crypto.subtle`.
   */
  async seal(text: string): Promise<string> {
    const stored = this.storage.secrets.get(PAYLOAD_KEY);
    let raw: string;
    if (typeof stored === "string") raw = stored;
    else {
      raw = base64Of(globalThis.crypto.getRandomValues(new Uint8Array(32)));
      this.storage.secrets.set(PAYLOAD_KEY, raw);
    }
    const nonce = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const sealed = await subtle().encrypt(
      { name: "AES-GCM", iv: nonce },
      await this.keyOf(raw),
      new TextEncoder().encode(text),
    );
    return `${VERSION}.${base64Of(nonce)}.${base64Of(new Uint8Array(sealed))}`;
  }

  /** The text `sealed` holds, or `undefined` when the current key cannot open it. */
  async open(sealed: string): Promise<string | undefined> {
    const raw = this.storage.secrets.get(PAYLOAD_KEY);
    const [version, nonce, data, ...rest] = sealed.split(".");
    if (typeof raw !== "string" || version !== VERSION || nonce === undefined || data === undefined)
      return undefined;
    if (rest.length > 0) return undefined;
    try {
      const plain = await subtle().decrypt(
        { name: "AES-GCM", iv: bytesOf(nonce) },
        await this.keyOf(raw),
        bytesOf(data),
      );
      return new TextDecoder().decode(plain);
    } catch {
      // Another key, a tampered text or bad base64: it cannot be opened, which is the answer.
      return undefined;
    }
  }

  /** The imported key of the stored value `raw`. */
  private keyOf(raw: string): Promise<CryptoKey> {
    if (this.imported?.raw !== raw)
      this.imported = {
        raw,
        key: subtle().importKey("raw", bytesOf(raw), "AES-GCM", false, ["encrypt", "decrypt"]),
      };
    return this.imported.key;
  }
}
