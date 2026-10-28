/**
 * Stackra file contract:
 * Purpose: `@ConsumesChanges(Model)` (or `@ConsumesChanges([ModelA, ModelB])`), the class facet by which a service
 *          that implements `ChangeConsumer` declares the models whose committed row changes it reacts to.
 * Boundary: made with `createDecorator`, so it records metadata only and may mark services only. Gen reads the facet
 *           and writes the `registerChangeConsumers` pairs into the member's registrations, so no hand call is needed;
 *           the model should carry `CapturesChanges` (a model watched only by consumers is still captured).
 * Runtime: isomorphic
 * Governing contract: data-layer gap cdc2 (declarative opt-in); ADR 0294 (decision 6: decorators are facets made by
 *                     createDecorator; configuration, not code); ADR 0221 (decision 5).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

/**
 * Declares the models a change consumer watches.
 *
 * @example
 * ```ts
 * @ConsumesChanges(Product)
 * export class ProductFeedService extends Service implements ChangeConsumer {
 *   async consume(change: RowChange): Promise<void> { ... }
 * }
 * ```
 */
export const ConsumesChanges = createDecorator<AnyClass | readonly AnyClass[]>({
  kind: "consumes_changes",
  target: DecoratorTarget.Class,
  kinds: ["service"],
});
