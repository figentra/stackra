/**
 * Stackra file contract:
 * Purpose: `MemoryReviewItemSinkDriver`, the in-process `ReviewItemSink`: the recorded review items in a list, for
 *          tests, local runs and a product that has not written its review model yet.
 * Boundary: one process only; a restart loses the items, so a product binds its own driver over its review model before
 *           it takes offline documents in production.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 4 and 5).
 */
import { Driver } from "@stackra/container";

import { ReviewItemSink } from "#contracts/ports/review-item-sink.port";
import type { ReviewItem } from "#contracts/types/review-item.type";

/**
 * Keeps review items in memory.
 *
 * @example
 * const sink = new MemoryReviewItemSinkDriver();
 * await pipeline.execute(CompleteSaleAction, input, { actor });
 * sink.items[0]?.reason; // "differs"
 */
export class MemoryReviewItemSinkDriver extends Driver(ReviewItemSink) {
  /** The recorded items, oldest first. */
  private readonly recorded: ReviewItem[] = [];

  /** The recorded items, oldest first. */
  get items(): readonly ReviewItem[] {
    return this.recorded;
  }

  /** Keeps `item`. */
  async record(item: ReviewItem): Promise<void> {
    this.recorded.push(Object.freeze({ ...item }));
  }
}
