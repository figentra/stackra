/**
 * Stackra file contract:
 * Purpose: the `ReviewItemSink` port: where the pipeline records a review item for an offline-computed document whose
 *          server answer differs or whose rule version is older than the action accepts.
 * Boundary: an abstract class that is its own token; the consuming product's driver writes its own review model. The
 *           pipeline records inside the action's unit of work, so a review item exists only for an applied document.
 *           This package ships the memory driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 4 and 5); ADR 0263 (ports are classes).
 */
import { Port } from "@stackra/contracts";

import type { ReviewItem } from "#contracts/types/review-item.type";

/**
 * Receives the documents that need review.
 *
 * @example
 * export class SaleReviewSinkDriver extends Driver(ReviewItemSink) {
 *   async record(item: ReviewItem): Promise<void> {
 *     await this.reviews.create({ reason: item.reason, client: item.client, server: item.server });
 *   }
 * }
 */
export abstract class ReviewItemSink extends Port {
  /** Records `item` for a reviewer to act on. */
  abstract record(item: ReviewItem): Promise<void>;
}
