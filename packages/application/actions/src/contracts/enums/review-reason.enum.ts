/**
 * Stackra file contract:
 * Purpose: `ReviewReason`, why the pipeline recorded a review item for an offline-computed document: the server's
 *          answer differs from the client's, or the client ran a rule version older than the action accepts.
 * Boundary: an enum (`Enum.of`) carried on every `ReviewItem`. Neither reason refuses the call: the server's answer
 *           stands and the review item records both.
 * Runtime: isomorphic
 * Governing contract: ADR 0337 (decisions 4 and 5); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * Why a document needs review.
 *
 * @example
 * if (item.reason === ReviewReason.OlderRuleVersion) notifyRelease(item);
 */
export const ReviewReason = Enum.of({
  /** The server re-evaluated the rule and got a different answer. */
  Differs: "differs",
  /** The document names a rule version older than the oldest the action accepts without review. */
  OlderRuleVersion: "older_rule_version",
});

/** One of the values above. */
export type ReviewReason = Enum.Value<typeof ReviewReason>;
