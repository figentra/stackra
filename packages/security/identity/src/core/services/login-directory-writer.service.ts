/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryWriterService`, how a region's identity service keeps its rows of the global login directory
 *          current: `record` the identifiers an account signs in with, `forget` the ones it no longer has (a changed
 *          email is `forget` of the old and `record` of the new; a deleted account is `forget` of all). The host's
 *          listeners on its own identity events call it, through the outbox, so a row follows every change.
 * Boundary: over `LoginDirectoryStore` and `LoginDirectoryConfig`. Writes only keys ending in this region, hashed by
 *           `loginDirectoryPrefix`; never the identifier in clear, never another region's key, never a read. An
 *           identifier that does not normalise is skipped (no row could match it). Idempotent, so an event delivered
 *           twice is harmless. Declares and consumes no event: the event names are the host's (rule 4b).
 * Runtime: isomorphic
 * Governing contract: ADR 0353 (decision 4); OS ADR 0002 (decision 1); ADR 0451.
 */
import { Service } from "@stackra/container";

import type { LoginDirectoryConfig } from "#config/login-directory.config";
import { loginDirectoryPrefix } from "#contracts/index";
import type { LoginDirectoryStore, LoginIdentifier } from "#contracts/index";

/**
 * Writes this region's login directory rows.
 *
 * @example
 * await writer.forget([{ kind: LoginIdentifierKind.Email, value: before.email }]);
 * await writer.record([{ kind: LoginIdentifierKind.Email, value: after.email }]);
 */
export class LoginDirectoryWriterService extends Service {
  /** The region, key id and key. */
  private readonly config: LoginDirectoryConfig;

  /** Where the rows go. */
  private readonly store: LoginDirectoryStore;

  /**
   * @param config - the writing region, the key id and the key.
   * @param store - the directory.
   * @throws TypeError when the region, the key id or the key is not set.
   */
  constructor(config: LoginDirectoryConfig, store: LoginDirectoryStore) {
    super();
    if (config.region === "" || config.keyId === "" || config.secret === "")
      throw new TypeError(
        "LoginDirectoryConfig needs region, keyId and the IDENTITY_LOGIN_DIRECTORY_KEY secret",
      );
    this.config = config;
    this.store = store;
  }

  /** Writes a row for each identifier; resolves to the number of rows written. */
  async record(identifiers: readonly LoginIdentifier[]): Promise<number> {
    const keys = await this.keysOf(identifiers);
    if (keys.length > 0) await this.store.put(keys);
    return keys.length;
  }

  /** Removes this region's row of each identifier; resolves to the number of rows removed. */
  async forget(identifiers: readonly LoginIdentifier[]): Promise<number> {
    const keys = await this.keysOf(identifiers);
    if (keys.length > 0) await this.store.remove(keys);
    return keys.length;
  }

  /** This region's key of each identifier that normalises, without repeats. */
  private async keysOf(identifiers: readonly LoginIdentifier[]): Promise<string[]> {
    const key = { id: this.config.keyId, secret: this.config.secret };
    const prefixes = await Promise.all(
      identifiers.map((identifier) => loginDirectoryPrefix(identifier, key)),
    );
    return [
      ...new Set(
        prefixes.flatMap((prefix) =>
          prefix === undefined ? [] : [`${prefix}${this.config.region}`],
        ),
      ),
    ];
  }
}
