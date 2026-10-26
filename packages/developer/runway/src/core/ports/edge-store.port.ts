/**
 * Stackra file contract:
 * Purpose: the `EdgeStore` port: writes and deletes rows of the edge Worker's KV copy. Runway is the only writer of
 *          platform `host:` rows and of app-link `wellknown:` rows.
 * Boundary: an abstract class that is its own token. KV is eventually consistent: a write reaches every location in
 *           about a minute, so nothing that must take effect at once relies on it (the API enforces). Values are
 *           public data only.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (decisions 6 and 7), ADR 0263 (ports resolve by type), ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

/** The edge Worker's KV copy. */
export abstract class EdgeStore extends Port {
  /**
   * Writes `value` under `key`, replacing any earlier value.
   *
   * @param key - `host:<hostname>` or `wellknown:<hostname>:<file>`.
   * @param value - the stored text.
   */
  abstract put(key: string, value: string): Promise<void>;

  /**
   * Removes `key`; removing an absent key is not an error.
   *
   * @param key - the row's key.
   */
  abstract delete(key: string): Promise<void>;
}
