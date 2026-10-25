/**
 * Stackra file contract:
 * Purpose: `RuleSetTemplate`, one default rule set of a `RuleSetPack`: its key, its consumer, its condition and its
 *          outcomes, as JSON until seeding checks them against the consumer's `Rules`.
 * Boundary: a type only, an element of `RuleSetPack["ruleSets"]`.
 * Runtime: isomorphic
 * Governing contract: config-model section 4.
 */
import type { RuleSetPack } from "#core/types/rule-set-pack.type";

/** One template. */
export type RuleSetTemplate = RuleSetPack["ruleSets"][number];
