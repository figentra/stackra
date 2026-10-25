/**
 * Stackra file contract:
 * Purpose: the `VisibilityFilter` port: the record-visibility conditions a principal's reads of a model carry, which
 *          `CrudService` and `GraphQuery` AND into every row list, single read, count and aggregate they run.
 * Boundary: an abstract class that is its own token. The data layer asks, the implementer decides: the model's
 *           visibility facet and the policy decision point's evaluation of the rules are another package's driver. The
 *           conditions narrow the rows a principal sees on top of row-level security and never replace it: scope
 *           isolation stays in the database, the filter carries none of it, and nothing here can widen a read or skip
 *           the policy. With no driver bound, reads are unchanged. A model that declares no visibility gets `{}` back;
 *           a principal that may see nothing gets a condition that matches nothing. `principal` is `undefined` outside
 *           an action or query call (a listener, a job runner, a seeder), and the driver decides what that sees.
 * Runtime: node
 * Governing contract: ADR 0333 (decisions 1, 3, 4 and 5, and its amendment: counts and aggregates too); ADR 0208
 *                     (decision 3); ADR 0327 (decision 9); ADR 0294 (decisions 16 and 17).
 */
import type { AnyClass } from "@stackra/container";
import { Port } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import type { Where } from "#contracts/types/where.type";

/**
 * The visibility conditions of reads.
 *
 * @example
 * export class IamVisibilityFilterDriver extends Driver(VisibilityFilter) {
 *   async conditionsFor<M extends object>(model: AnyClass<M>, principal: Actor | undefined): Promise<Where<M>> {
 *     return this.decisions.visibleWhere(model, principal);
 *   }
 * }
 */
export abstract class VisibilityFilter extends Port {
  /**
   * The conditions `principal`'s reads of `model` carry, as a filter of `M`; `{}` for none.
   *
   * @param model - the model being read.
   * @param principal - the caller of the running action or query; `undefined` outside one.
   */
  abstract conditionsFor<M extends object>(
    model: AnyClass<M>,
    principal: Actor | undefined,
  ): Promise<Where<M>>;
}
