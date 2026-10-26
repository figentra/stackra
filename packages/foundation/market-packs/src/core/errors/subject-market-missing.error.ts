/**
 * Stackra file contract:
 * Purpose: `SubjectMarketMissingError`, the refusal when a rule kind's subject names a market the record does not
 *          carry (a sales-tax rule asked for a sale with no buyer address): the caller supplies it, never a guess.
 * Boundary: a refusal (`failed_precondition`); code `subject_market_missing`, derived from the class name. The fields
 *           are codes only.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (the subject rule); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

import type { PackSubject } from "#core/enums/pack-subject.enum";

/**
 * The record lacks the market the rule kind needs.
 *
 * @example
 * throw SubjectMarketMissingError.create({ subject: PackSubject.Buyer, ruleKind: "tax.sales" });
 */
export class SubjectMarketMissingError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The subject whose market is missing. */
  subject!: PackSubject;

  /** The rule kind asked for. */
  ruleKind!: string;
}
