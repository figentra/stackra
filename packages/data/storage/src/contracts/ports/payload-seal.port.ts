/**
 * Stackra file contract:
 * Purpose: the `PayloadSeal` port: seals the payloads the `outbox` and `cache` areas hold at rest, with a key that lives
 *          in the `secrets` area and is bound to the device's session, and opens them again while that key is there
 *          (ADR 0338 decision 2).
 * Boundary: an abstract class that is its own token, keyed `storage.PayloadSeal`. The key is minted on the first seal
 *           of a session and leaves with the `secrets` area: a wipe on revoke or past the offline limit clears it, so
 *           nothing sealed before can be opened again. `open` answers `undefined`, never throws, for text it cannot
 *           open (another key, a wiped key, text that was never sealed). Drivers: `web_crypto` (AES-GCM, wherever
 *           `crypto.subtle` exists) and `memory` (tests and a native target until its driver lands).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 2); ADR 0256 (decision 2: the areas); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * Seals and opens payloads at rest.
 *
 * @example
 * const sealed = await seal.seal(JSON.stringify(queue));
 * const text = await seal.open(sealed); // undefined once the key was wiped
 */
export abstract class PayloadSeal extends Port {
  /** Type-only port key, so `DriverName<PayloadSeal>` narrows to this port's drivers. */
  declare readonly "~key": "storage.PayloadSeal";

  /** Whether what `seal` returns is encrypted, so a reader of it alone learns nothing. */
  abstract readonly isEncrypting: boolean;

  /**
   * Seals `text` with the session's key, minting the key first when the `secrets` area holds none.
   *
   * @throws Error when the platform offers no way to seal (no `crypto.subtle` for the `web_crypto` driver).
   */
  abstract seal(text: string): Promise<string>;

  /** The text `sealed` holds, or `undefined` when the current key cannot open it. */
  abstract open(sealed: string): Promise<string | undefined>;
}
