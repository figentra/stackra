/**
 * Stackra file contract:
 * Purpose: the `DeviceSearchIndex` port, the phone's own search index (iOS Core Spotlight, Android launcher search):
 *          add entries, remove them by link, clear everything this app put there, and hear which entry the person
 *          opened from the system search.
 * Boundary: an abstract class that is its own token, keyed `native-spotlight.DeviceSearchIndex`; a driver per target
 *           implements it with `extends Driver(DeviceSearchIndex)` (memory, Expo). It decides nothing about what may
 *           be indexed: `SpotlightIndexer` applies the visibility rules first. A target with no system search keeps
 *           nothing and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5: one capability, one package, behind a port); ADR 0250.
 */
import { Port } from "@stackra/contracts";

import type { DeviceSearchItem } from "#contracts/types/device-search-item.type";

/**
 * The phone's search index for this app.
 *
 * @example
 * const index = useContainer().get(DeviceSearchIndex);
 * await index.index([{ url: "app://crm/customers/cus_1", kind: "crm.customer", title: "Sara", description: null, keywords: [] }]);
 * const stop = index.opened((url) => navigation.navigate(url));
 */
export abstract class DeviceSearchIndex extends Port {
  /** Type-only port key, so `DriverName<DeviceSearchIndex>` narrows to this port's drivers. */
  declare readonly "~key": "native-spotlight.DeviceSearchIndex";

  /** Adds or replaces `items`, matched by their link. */
  abstract index(items: readonly DeviceSearchItem[]): Promise<void>;

  /** Removes the entries with these links. */
  abstract remove(urls: readonly string[]): Promise<void>;

  /** Removes every entry this app added. */
  abstract clear(): Promise<void>;

  /**
   * Calls `listener` with the link of each entry the person opens from the system search, the one that launched the
   * app included.
   *
   * @returns stops listening.
   */
  abstract opened(listener: (url: string) => void): () => void;
}
