/**
 * Stackra file contract:
 * Purpose: `registerChangeConsumers`, how a service watches a model's rows: each pair names a model and a class that
 *          implements `ChangeConsumer`; from then on every flush of that model's rows writes a change message in the
 *          same transaction, and the relay hands each committed change to the consumer resolved from its container.
 *          @stackra/search (automatic indexing) and @stackra/segments (membership) wire themselves through it.
 * Boundary: writes the process-wide `CHANGE_CONSUMERS`; a pair registered again does nothing. Models are told apart by
 *           class name in a stored change, so two model classes of one name are refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5); ADR 0078 (decision 4); the events precedent (`registerListeners`).
 */
import type { AnyClass } from "@stackra/container";

import type { ChangeConsumer } from "#contracts/index";
import { CHANGE_CONSUMERS } from "#core/constants/change-consumers.constant";

/**
 * Registers change consumers against the models they watch.
 *
 * @throws TypeError when another model class of the same name is already watched.
 * @example
 * registerChangeConsumers([[Product, ProductIndexConsumer]]);
 */
export function registerChangeConsumers(
  pairs: readonly (readonly [AnyClass, AnyClass<ChangeConsumer>])[],
): void {
  for (const [model, consumer] of pairs) {
    const watch = CHANGE_CONSUMERS.get(model.name) ?? { model, consumers: [] };
    if (watch.model !== model)
      throw new TypeError(
        `registerChangeConsumers: two models are named ${model.name}; a stored change names its model by class name`,
      );
    if (!watch.consumers.includes(consumer)) watch.consumers.push(consumer);
    CHANGE_CONSUMERS.set(model.name, watch);
  }
}
