/**
 * Stackra file contract:
 * Purpose: `AwardRecipient`, one row a consumer registers so award kinds may be granted to records of one of its
 *          models: the model's key and the fields a kind's criteria over it may test.
 * Boundary: a type only. The consumer computes the facts and hands them to `AwardService.consider`; achievements only
 *           evaluate them through @stackra/rules (ADR 0331 decision 9).
 * Runtime: isomorphic
 * Governing contract: ADR 0368 (decisions 1 and 4); ADR 0331 (decisions 4 and 9).
 */
import type { Rules } from "@stackra/rules";

/**
 * A model awards may be granted to.
 *
 * @example
 * registerAwardRecipients([{ model: "workforce.member", rules: MEMBER_AWARD_RULES }]);
 */
export interface AwardRecipient {
  /** The recipient model's key, `<module>.<model>` (`workforce.member`). */
  readonly model: string;

  /** The fields a kind's criteria over this model may test; its key is the consumer key of the kinds' rule sets. */
  readonly rules: Rules;
}
