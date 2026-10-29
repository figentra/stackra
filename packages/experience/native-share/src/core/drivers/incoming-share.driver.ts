/**
 * Stackra file contract:
 * Purpose: `IncomingShareDriver`, the base every `IncomingShare` driver extends: it applies `NativeShareConfig` to
 *          what the target received (kinds, file types, item count, text length) and to each file read (size).
 * Boundary: abstract; a driver supplies `received` (the raw items), `load` (a file's bytes), `clear` and
 *           `subscribe`. A link must be http or https; anything the configuration refuses is dropped, never thrown.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decision 5); ADR 0266 (drivers behind a port); ADR 0294 (decision 17).
 */
import { Driver } from "@stackra/container";

import type { NativeShareConfig } from "#config/native-share.config";
import { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";

/**
 * The shared checks of the share drivers.
 *
 * @example
 * export class ExpoIncomingShareDriver extends IncomingShareDriver { ... }
 */
export abstract class IncomingShareDriver extends Driver(IncomingShare) {
  /** The native share configuration the checks read. */
  protected readonly config: NativeShareConfig;

  /**
   * @param config - the native share configuration.
   */
  constructor(config: NativeShareConfig) {
    super();
    this.config = config;
  }

  /** The accepted items, at most `maxItems`. */
  async pending(): Promise<readonly SharedItem[]> {
    return (await this.received())
      .filter((item) => this.accepts(item))
      .slice(0, this.config.maxItems);
  }

  /** An accepted file's bytes, when it is still there and within `maxBytes`. */
  async read(item: SharedItem): Promise<Blob | null> {
    if (item.kind !== "file" || !this.accepts(item)) return null;
    const blob = await this.load(item).catch(() => null);
    return blob !== null && blob.size <= this.config.maxBytes ? blob : null;
  }

  /** What the target received, before the checks. */
  protected abstract received(): Promise<readonly SharedItem[]>;

  /** A file's bytes; `null` or a rejection when it is gone. */
  protected abstract load(item: SharedItem): Promise<Blob | null>;

  /** Whether the configuration takes `item`. */
  private accepts(item: SharedItem): boolean {
    const { config } = this;
    if (item.kind === "text") return config.text && item.value.length <= config.maxTextLength;
    if (item.kind === "url") return config.links && /^https?:\/\//i.test(item.value);
    return config.fileTypes.some((type) =>
      type.endsWith("/*") ? item.mimeType.startsWith(type.slice(0, -1)) : item.mimeType === type,
    );
  }
}
