/**
 * Stackra file contract:
 * Purpose: `SafeStoragePayloadSealDriver`, the `safe_storage` driver of `PayloadSeal` for the Electron main process:
 *          payloads are sealed by the operating system's keychain (`safeStorage`: Keychain on macOS, DPAPI on Windows,
 *          the secret service on Linux), bound to the device's session by a session id kept in the `secrets` area.
 * Boundary: main process only (it loads `electron`; the renderer reaches it over the preload bridge). The session id is
 *           minted on the first seal of a session and sealed into every payload; `open` answers `undefined` when the id
 *           differs or `secrets` holds none, so a wipe on revoke or past the offline limit makes every earlier payload
 *           unopenable, as the port promises. Sealed text is `ss1.<base64>`; anything else, a tampered text, or a
 *           payload the keychain cannot decrypt opens to `undefined`. `seal` refuses when the platform offers no
 *           keychain encryption, rather than writing in clear.
 * Runtime: node
 * Governing contract: ADR 0338 (decision 2); ADR 0256 (desktop keeps its key in `safeStorage`); ADR 0058 (Electron);
 *                     ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { safeStorage } from "electron";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import type { Storage } from "#contracts/ports/storage.port";
import { PAYLOAD_KEY } from "#core/constants/payload-key.constant";

/** The format tag of a sealed text. */
const VERSION = "ss1";

/**
 * Seals payloads with the operating system's keychain.
 *
 * @example
 * drivers: [{ port: PayloadSeal, candidates: { electron: () => SafeStoragePayloadSealDriver } }]
 */
export class SafeStoragePayloadSealDriver extends Driver(PayloadSeal) {
  /** The keychain encrypts: the sealed text alone reveals nothing. */
  readonly isEncrypting = true;

  private readonly storage: Storage;

  /** @param storage - holds the session id in its `secrets` area. */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /**
   * Seals `text` under the session id, minting the id first when `secrets` holds none.
   *
   * @throws Error when the platform offers no keychain encryption.
   */
  async seal(text: string): Promise<string> {
    if (!safeStorage.isEncryptionAvailable())
      throw new Error("PayloadSeal safe_storage needs keychain encryption on this platform");
    const stored = this.storage.secrets.get(PAYLOAD_KEY);
    let session: string;
    if (typeof stored === "string") session = stored;
    else {
      session = globalThis.crypto.randomUUID();
      this.storage.secrets.set(PAYLOAD_KEY, session);
    }
    const sealed = safeStorage.encryptString(`${session}\n${text}`);
    return `${VERSION}.${sealed.toString("base64")}`;
  }

  /** The text `sealed` holds, or `undefined` when the session or the keychain cannot open it. */
  async open(sealed: string): Promise<string | undefined> {
    const session = this.storage.secrets.get(PAYLOAD_KEY);
    const [version, data, ...rest] = sealed.split(".");
    if (typeof session !== "string" || version !== VERSION || data === undefined) return undefined;
    if (rest.length > 0) return undefined;
    let plain: string;
    try {
      plain = safeStorage.decryptString(Buffer.from(data, "base64"));
    } catch {
      // Another keychain, a tampered text or a payload of another install: it cannot be opened, which is the answer.
      return undefined;
    }
    const split = plain.indexOf("\n");
    return split >= 0 && plain.slice(0, split) === session ? plain.slice(split + 1) : undefined;
  }
}
