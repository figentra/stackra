/**
 * Stackra file contract:
 * Purpose: `MemoryIncomingShareDriver`, the `IncomingShare` driver of tests and of targets with no share sheet into
 *          the app (the web, the desktop): the `memory` candidate; a test hands items in with `receive`.
 * Boundary: holds items and file bytes in memory; `receive` notifies the subscribers as a new share would. The
 *           configuration's checks are the base's, so a test sees what a phone would accept.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); ADR 0478 (decision 5).
 */
import { NativeShareConfig } from "#config/native-share.config";
import type { SharedItem } from "#contracts/types/shared-item.type";
import { IncomingShareDriver } from "#core/drivers/incoming-share.driver";

/**
 * A share inbox in memory.
 *
 * @example
 * const share = new MemoryIncomingShareDriver();
 * share.receive({ kind: "file", value: "file:///a.pdf", mimeType: "application/pdf", name: "a.pdf" }, pdf);
 */
export class MemoryIncomingShareDriver extends IncomingShareDriver {
  /** The items received and not cleared. */
  private items: SharedItem[] = [];

  /** The bytes of each received file, by its `value`. */
  private readonly files = new Map<string, Blob>();

  /** Who hears of a new share. */
  private readonly listeners = new Set<() => void>();

  /**
   * @param config - the native share configuration; the defaults when omitted.
   */
  constructor(config: NativeShareConfig = new NativeShareConfig()) {
    super(config);
  }

  /** Plays a share from another app: keeps `item` (and the bytes of a file) and tells the subscribers. */
  receive(item: SharedItem, file?: Blob): void {
    this.items.push(item);
    if (file !== undefined) this.files.set(item.value, file);
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes mid-loop skips no other
    for (const listener of [...this.listeners]) listener();
  }

  /** Forgets every item and its bytes. */
  async clear(): Promise<void> {
    this.items = [];
    this.files.clear();
  }

  /** Calls `listener` on each `receive`. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** The items received. */
  protected async received(): Promise<readonly SharedItem[]> {
    return this.items;
  }

  /** The bytes kept for a file. */
  protected async load(item: SharedItem): Promise<Blob | null> {
    return this.files.get(item.value) ?? null;
  }
}
