/**
 * Stackra file contract:
 * Purpose: `drainOutbox()`, the relay and the inbox of a test in one step: it takes what the testing app compiled
 *          last wrote to its `OutboxFake` and what `deliverRemoteEvent` received, delivers each occurrence once to its
 *          listeners, drains the bus, and repeats until nothing is left, so a chain of reactions settles. With a delivery
 *          scope registered (`deliverEventsIn`, by `@stackra/database`'s testing entry), each event is delivered on its
 *          own, as the production inbox does: in a transaction, as its actor, in the scope it was written in (STA-1789).
 * Boundary: works through the port fake, never `@stackra/outbox`; an app whose `EventOutbox` is another driver is
 *           refused. An occurrence whose id the inbox has already delivered runs no listener. A listener failure is
 *           returned and kept for `app.listeners.failures`, never thrown.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decisions 2 and 4); ADR 0141 (decision 3).
 */
import { Event } from "#core/index";
import type { ListenerDelivery } from "#core/index";
import { DELIVERY_SCOPE } from "#testing/constants/delivery-scope.constant";
import { currentHarness } from "#testing/functions/current-harness.function";
import { OutboxFake } from "#testing/outbox.fake";

/**
 * Relays the current app's outbox and inbox until both are empty.
 *
 * @returns the deliveries made, failures included.
 * @throws Error when no testing app has been compiled.
 * @throws TypeError when the app's outbox is not an `OutboxFake`, or the outbox holds something that is not an event.
 * @example
 * await run(PlaceOrderAction, input, { as: actors.customer() });
 * await drainOutbox(); // publishes order.placed and runs its listeners
 */
export async function drainOutbox(): Promise<readonly ListenerDelivery[]> {
  const { bus, outbox, inbox, seen, scopes, app } = currentHarness();
  if (!(outbox instanceof OutboxFake))
    throw new TypeError(
      `drainOutbox needs the outbox fake, but the app binds ${outbox.constructor.name}: ` +
        "use .override(EventOutbox, new OutboxFake())",
    );
  const deliveries: ListenerDelivery[] = [];
  const within = DELIVERY_SCOPE.value;
  for (;;) {
    const pending = [...outbox.take(), ...inbox.splice(0)];
    let ran = 0;
    for (const { event, meta } of pending) {
      if (!(event instanceof Event))
        throw new TypeError(`The outbox holds ${String(event)}, which is not an event`);
      if (meta.id !== undefined) {
        if (seen.has(meta.id)) continue;
        seen.add(meta.id);
      }
      if (within === undefined) {
        bus.deliver(event, meta);
        continue;
      }
      // As the inbox: one delivery at a time, in its own transaction as the event's actor in its scope (STA-1789).
      const scope = meta.id === undefined ? undefined : scopes.get(meta.id);
      const done = await within(app, meta, scope, () => {
        bus.deliver(event, meta);
        return bus.drain();
      });
      deliveries.push(...done);
      ran += done.length;
    }
    const drained = await bus.drain();
    deliveries.push(...drained);
    ran += drained.length;
    if (pending.length === 0 && ran === 0) return deliveries;
  }
}
