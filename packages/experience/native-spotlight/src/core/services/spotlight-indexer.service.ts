/**
 * Stackra file contract:
 * Purpose: `SpotlightIndexer`, what feeds the phone's search: `sync` replaces this app's entries with the records the
 *          visibility rules allow for the signed-in person, and `clearOnSignOut` removes every entry when the person
 *          signs out or identity revokes the session (which is how an erased account reaches the device).
 * Boundary: a singleton service over `SpotlightConfig` and the `DeviceSearchIndex` driver; it fetches no records, the
 *           app hands in the recent ones it already read. `sync` clears before it indexes, so a record that left the
 *           rules (changed owner, turned sensitive, aged out, deleted) leaves the phone too. A clear that fails is
 *           dropped here: a later sync or sign-out clears again.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0189 (decision 2: erasure reaches every copy); ADR 0338 (decision 4).
 */
import { Service } from "@stackra/container";

import type { SpotlightConfig } from "#config/spotlight.config";
import type { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import { indexableItems } from "#core/functions/indexable-items.function";
import type { DeviceSearchRecord } from "#core/types/device-search-record.type";
import type { DeviceSession } from "#core/types/device-session.type";

/**
 * Feeds and clears the phone's search.
 *
 * @example
 * const stop = indexer.clearOnSignOut(container.get(OfflineSession));
 * await indexer.sync(session.user.id, recentRecords);
 */
export class SpotlightIndexer extends Service {
  /** The visibility rules. */
  private readonly config: SpotlightConfig;

  /** The phone's search index. */
  private readonly index: DeviceSearchIndex;

  /**
   * @param config - the visibility rules.
   * @param index - the phone's search index.
   */
  constructor(config: SpotlightConfig, index: DeviceSearchIndex) {
    super();
    this.config = config;
    this.index = index;
  }

  /** Replaces this app's entries with the records of `userId` the rules allow; `null` (signed out) only clears. */
  async sync(userId: string | null, records: readonly DeviceSearchRecord[]): Promise<void> {
    const items = indexableItems(this.config, userId, records, new Date());
    await this.index.clear();
    if (items.length > 0) await this.index.index(items);
  }

  /** Removes the entries of records that were deleted or left the rules since the last sync. */
  remove(urls: readonly string[]): Promise<void> {
    return this.index.remove(urls);
  }

  /**
   * Clears every entry when `session` signs out or is revoked, and at once when it is revoked already (an account
   * erased while the app was closed).
   *
   * @returns stops watching.
   */
  clearOnSignOut(session: DeviceSession): () => void {
    const clear = () => void this.index.clear().catch(() => undefined);
    if (session.isRevoked.get()) clear();
    const stopSignedIn = session.isSignedIn.subscribe((isSignedIn) => {
      if (!isSignedIn) clear();
    });
    const stopRevoked = session.isRevoked.subscribe((isRevoked) => {
      if (isRevoked) clear();
    });
    return () => {
      stopSignedIn();
      stopRevoked();
    };
  }
}
