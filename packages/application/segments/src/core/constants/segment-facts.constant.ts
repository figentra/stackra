/**
 * Stackra file contract:
 * Purpose: `SEGMENT_FACTS`, the fact source segments supplies to the rules engine: `segments.ids`, the public ids of
 *          the segments a subject is a member of, so a business rule tests "the subject is in segment X"
 *          (`{ field: "segments.ids", operator: Operator.Includes, value: "seg_…" }`).
 * Boundary: a description only, isomorphic, so a rule builder in the browser registers it too
 *           (`rules.register(SEGMENT_FACTS)`). The facts behind it come from `SegmentFactProviderDriver` (`./node`).
 *           IAM never reads it: a segment is a business level, not a permission level (ADR 0462 decision 1).
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 4); ADR 0332 (decision 5: consumers read memberships, never a rule set);
 *                     ADR 0462 (decision 1).
 */
import type { FactSource } from "@stackra/rules/contracts";
import { FieldType } from "@stackra/rules/contracts";

/**
 * The segment-membership fact source.
 *
 * @example
 * CANCEL_RULES.register(SEGMENT_FACTS);
 * const vipsOnly = { field: "segments.ids", operator: Operator.Includes, value: vip.id };
 */
export const SEGMENT_FACTS = Object.freeze({
  key: "segments",
  fields: Object.freeze({
    ids: {
      type: FieldType.List,
      label: "segments::facts.ids" as FactSource["fields"][string]["label"],
    },
  }),
}) satisfies FactSource;
