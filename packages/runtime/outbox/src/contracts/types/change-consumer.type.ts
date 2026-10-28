/**
 * Stackra file contract:
 * Purpose: `ChangeConsumer`, what a service implements to react to a watched model's row changes after they commit:
 *          @stackra/search keeps its index current and @stackra/segments recomputes membership through it.
 * Boundary: a type only, not a port: several consumers watch one model, so each is its own class, registered against
 *           the model with `registerChangeConsumers` and resolved from the container the relay is connected to.
 *           Delivery is at least once and in the row's scope; `consume` must be idempotent, and a throw makes the relay
 *           retry the change for every consumer of the model.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox, under five seconds of lag); ADR 0078
 *                     (decision 4: every consumer is idempotent).
 */
import type { RowChange } from "#contracts/types/row-change.type";

/** Reacts to committed row changes. */
export interface ChangeConsumer {
  /** Handles one committed change of a model this consumer is registered for. */
  consume: (change: RowChange) => Promise<void>;
}
