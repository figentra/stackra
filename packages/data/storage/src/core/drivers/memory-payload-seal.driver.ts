/**
 * Stackra file contract:
 * Purpose: `MemoryPayloadSealDriver`, the `memory` driver of `PayloadSeal`: the seal of a test, a server render and a
 *          native target until its platform driver lands. It encrypts nothing; it binds each payload to the session's
 *          key id in the `secrets` area, so a wipe makes it unopenable exactly as with a real key.
 * Boundary: reports `isEncrypting: false`, so a persister over it never stores the query cache while encryption is
 *           required. Sealed text is `m1.<key id>.<text>`; text under another key id, or after the key was wiped,
 *           opens to `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 2); ADR 0266 (memory drivers first); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import type { Storage } from "#contracts/ports/storage.port";
import { PAYLOAD_KEY } from "#core/constants/payload-key.constant";

/** The format tag of a sealed text. */
const VERSION = "m1";

/**
 * Binds payloads to the session's key without encrypting them.
 *
 * @example
 * const seal = new MemoryPayloadSealDriver(fakeStorage());
 */
export class MemoryPayloadSealDriver extends Driver(PayloadSeal) {
  /** Nothing is encrypted. */
  readonly isEncrypting = false;

  private readonly storage: Storage;

  /**
   * @param storage - holds the key id in its `secrets` area.
   */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /** `text` tagged with the session's key id, minted first when `secrets` holds none. */
  seal(text: string): Promise<string> {
    const stored = this.storage.secrets.get(PAYLOAD_KEY);
    const keyId = typeof stored === "string" ? stored : globalThis.crypto.randomUUID();
    if (stored !== keyId) this.storage.secrets.set(PAYLOAD_KEY, keyId);
    return Promise.resolve(`${VERSION}.${keyId}.${text}`);
  }

  /** The text of `sealed`, or `undefined` when it was tagged with another key id or the key is gone. */
  open(sealed: string): Promise<string | undefined> {
    const keyId = this.storage.secrets.get(PAYLOAD_KEY);
    const prefix = `${VERSION}.${String(keyId)}.`;
    return Promise.resolve(
      typeof keyId === "string" && sealed.startsWith(prefix)
        ? sealed.slice(prefix.length)
        : undefined,
    );
  }
}
