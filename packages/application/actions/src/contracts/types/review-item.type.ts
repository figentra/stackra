/**
 * Stackra file contract:
 * Purpose: `ReviewItem`, what the pipeline hands a `ReviewItemSink` when an offline-computed document needs review: the
 *          call, the reason, the rule versions and both answers, and the action's output (the server's document).
 * Boundary: a type only. The consuming product owns the stored record and its model; the sink maps this onto it. The
 *           answers are the evaluator's JSON, never a database row.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 4 and 5: the server wins; a differing or older document is a review item
 *                     with both answers).
 */
import type { Json } from "@stackra/contracts";

import type { ReviewReason } from "#contracts/enums/review-reason.enum";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/** One document to review. */
export interface ReviewItem {
  /** The call that applied the document. */
  readonly call: CallDescriptor;

  /** The call's instant. */
  readonly at: Date;

  /** Why it needs review. */
  readonly reason: ReviewReason;

  /** The rule version the client computed the document with. */
  readonly ruleVersion: string;

  /** The oldest rule version the action accepts without review. */
  readonly acceptedVersion: string;

  /** The client's answer. */
  readonly client: Json;

  /** The server's answer on its current data. */
  readonly server: Json;

  /** The action's output: the document as the server applied it. */
  readonly output: unknown;
}
