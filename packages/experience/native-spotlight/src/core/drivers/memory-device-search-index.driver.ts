/**
 * Stackra file contract:
 * Purpose: `MemoryDeviceSearchIndexDriver`, the `DeviceSearchIndex` driver of tests and of targets with no system
 *          search of their own (the web, the desktop): the `memory` candidate; `open` plays a tap on a result.
 * Boundary: keeps entries in a map keyed by link; nothing leaves the process. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0478 (decision 5).
 */
import { Driver } from "@stackra/container";

import { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
import type { DeviceSearchItem } from "#contracts/types/device-search-item.type";

/**
 * The phone's search, in memory.
 *
 * @example
 * const index = new MemoryDeviceSearchIndexDriver();
 * index.opened((url) => visited.push(url));
 * index.open("app://crm/customers/cus_1");
 */
export class MemoryDeviceSearchIndexDriver extends Driver(DeviceSearchIndex) {
  /** The entries, keyed by link. */
  readonly items = new Map<string, DeviceSearchItem>();

  /** Who hears an opened entry. */
  private readonly listeners = new Set<(url: string) => void>();

  /** Adds or replaces `items` by link. */
  async index(items: readonly DeviceSearchItem[]): Promise<void> {
    for (const item of items) this.items.set(item.url, item);
  }

  /** Removes the entries with these links. */
  async remove(urls: readonly string[]): Promise<void> {
    for (const url of urls) this.items.delete(url);
  }

  /** Removes every entry. */
  async clear(): Promise<void> {
    this.items.clear();
  }

  /** Calls `listener` on each `open`. */
  opened(listener: (url: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Plays the person opening the entry `url` from the system search. */
  open(url: string): void {
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that stops another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener(url);
  }
}
