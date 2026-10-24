/**
 * Stackra file contract:
 * Purpose: `Facts<M>`, the kind base of the facts an agent gets about one record of `M` (or one page or user): its
 *          `provide(id, ctx)` returns a sentence and the facts behind it, read as the agent's principal.
 * Boundary: a bare kind base with the subject as a type argument (`extends Facts<Order>`, ADR 0305 rule 5); the
 *           subject is type-only, so gen reads it from the heritage clause and writes the class with the subject's id
 *           prefix into the facts table of `#stackra/ai`, and the MCP gateway attaches the facts when a conversation
 *           names such an id. A binding: dependencies are constructor parameters. It reads through the same services
 *           and the same `authorize` as the queries, and returns public ids only.
 * Runtime: node
 * Governing contract: ADR 0245 (decision 7, as amended by ADR 0294: `@ContextProvider` became `Facts`); ADR 0305
 *                     (rules 5 and 6); ADR 0294 (decisions 13 and 16); ADR 0156 (guardrails).
 */
import { registerKind } from "@stackra/container";

import type { ContextFacts } from "#core/types/context-facts.type";
import type { FactsContext } from "#core/types/facts-context.type";

/**
 * The facts kind base.
 *
 * @example
 * export class OrderFacts extends Facts<Order> {
 *   constructor(orders: OrderService) {
 *     super();
 *     this.orders = orders;
 *   }
 *
 *   async provide(orderId: Order["id"], ctx: FactsContext): Promise<ContextFacts> {
 *     const order = await this.orders.findOneOrFail({ id: orderId });
 *     await ctx.authorize(order);
 *     const view = this.orders.toView(order);
 *     return { summary: `Order ${view.id} is ${view.status}.`, facts: { ...view } };
 *   }
 * }
 */
export abstract class Facts<M extends { readonly id: unknown }> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a facts class. */
  declare readonly "~kind": "facts";

  /** Type-only: the subject these facts describe. */
  declare readonly "~subject"?: M;

  /**
   * The facts about the subject with id `id`.
   *
   * @throws Refusal `forbidden` (from `ctx.authorize`) when the principal may not read it; the gateway then omits the
   *         facts. Any other refusal of a read (not found) means the same.
   */
  abstract provide(id: M["id"], ctx: FactsContext): Promise<ContextFacts>;
}

registerKind(Facts, "facts");
