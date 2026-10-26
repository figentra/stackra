/**
 * Stackra file contract:
 * Purpose: `RuleSetPublished`, recorded when a rule set's revision is published: the rule set, its consumer and the
 *          revision that evaluations now use by default.
 * Boundary: a domain event, so it is dispatched in process after commit and a rolled-back publish leaves none; a
 *           consumer in the same service listens (segments recompute a dynamic segment on it, ADR 0332 decision 3).
 *           It carries no condition. It registers this package's own schema when the module loads, so
 *           `RuleSetPublished.create` works with no generated file.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 5); ADR 0332 (decision 3); ADR 0305 (rules 19 and 21); ADR 0294
 *                     (decision 27).
 */
import type { PublicId } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { Int, registerSchemas } from "@stackra/validation";

import { RULE_SET_PUBLISHED_SCHEMA } from "#core/constants/rule-set-published-schema.constant";

/**
 * One published revision.
 *
 * @example
 * export class RecomputeSegmentListener extends Listener {
 *   async handle(event: RuleSetPublished): Promise<void> {
 *     if (event.consumer === "segments.segment") await this.segments.recompute(event.ruleSetId);
 *   }
 * }
 */
export class RuleSetPublished extends DomainEvent {
  /** The revision now published. */
  @Int({ min: 1 })
  revision!: number;

  /** The rule set. */
  ruleSetId!: PublicId<"rset">;

  /** The key of the consumer that owns it (`segments.segment`). */
  consumer!: string;
}

registerSchemas([[RuleSetPublished, RULE_SET_PUBLISHED_SCHEMA]]);
