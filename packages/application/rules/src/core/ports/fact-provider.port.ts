/**
 * Stackra file contract:
 * Purpose: the `FactProvider` port: how an add-on package supplies a fact source to rules it does not own. It
 *          describes its source (`source`) and computes that source's facts for one subject (`factsOf`), so a
 *          business rule can test a fact such as "the subject is in segment X"
 *          (`{ field: "segments.ids", operator: Operator.Includes, value: "seg_…" }`).
 * Boundary: an abstract class that is its own token, keyed `rules.FactProvider`. It completes the existing hook:
 *           `Rules.register` (ADR 0455) already lets a later package add a source's description; this port adds the
 *           facts behind it. The engine still loads nothing:
 *           the consumer that evaluates asks the bound providers for their facts (`factsFrom`) and passes them to
 *           `evaluate` with its own. The engine names no add-on; @stackra/segments binds a driver to this port, never
 *           the other way round (ADR 0462 decision 1). A provider with nothing to say returns `{}`, and a missing
 *           fact matches only `is_not_set`.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decision 4: a field no registered source describes cannot be tested); ADR 0462
 *                     (decision 1: segment-targeted business rules live in the rules engine).
 */
import { Port } from "@stackra/contracts";

import type { FactSource } from "#contracts/index";
import type { FactSubject } from "#core/types/fact-subject.type";
import type { RuleFacts } from "#core/types/rule-facts.type";

/**
 * Supplies one fact source's facts.
 *
 * @example
 * export class SegmentFactProviderDriver extends Driver(FactProvider) {
 *   readonly source = SEGMENT_FACTS;
 *   async factsOf(subject: FactSubject): Promise<RuleFacts[string]> {
 *     return { ids: (await this.memberships.segmentsOf(subject)).map((segment) => segment.id) };
 *   }
 * }
 */
export abstract class FactProvider extends Port {
  /** Type-only port key, so `DriverName<FactProvider>` narrows to this port's drivers. */
  declare readonly "~key": "rules.FactProvider";

  /** The source this provider computes; a consumer registers it on its `Rules` (`rules.register(provider.source)`). */
  abstract readonly source: FactSource;

  /**
   * The facts of `source` for `subject`, by field key.
   *
   * @throws Error when the provider's store cannot be reached; the caller fails closed.
   */
  abstract factsOf(subject: FactSubject): Promise<RuleFacts[string]>;
}
