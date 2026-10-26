/**
 * Stackra file contract:
 * Purpose: the `AgentModels` port: the model instance one agent run talks to, chosen for its task type and the acting
 *          principal's tenant (region, data class, own keys).
 * Boundary: an abstract class that is its own token, keyed `ai.AgentModels`. The ai service implements it with
 *           `routeModel` over the route-table settings and `resolveModel` over the bound provider drivers (managed or
 *           the tenant's own keys); this package names no provider and never accepts a model id string.
 * Runtime: isomorphic
 * Governing contract: ADR 0156 (decision 2); ADR 0360 (decisions 14 and 15); ADR 0155 (no hosted gateway); STA-781.
 */
import { type Actor, Port } from "@stackra/contracts";
import type { LanguageModel } from "ai";

/**
 * Chooses models for runs.
 *
 * @example
 * const model = await models.model("chat", run.actor);
 */
export abstract class AgentModels extends Port {
  /** Type-only port key, so `DriverName<AgentModels>` narrows to this port's drivers. */
  declare readonly "~key": "ai.AgentModels";

  /**
   * The model for `task` (`chat`) on behalf of `actor`.
   *
   * @throws RangeError when the router refuses the call (no route, a closed data class).
   */
  abstract model(task: string, actor: Actor): Promise<Exclude<LanguageModel, string>>;
}
