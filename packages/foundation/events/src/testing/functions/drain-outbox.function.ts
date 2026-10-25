/**
 * Stackra file contract:
 * Purpose: `drainOutbox()`, the relay and the inbox of a test in one step: it takes what the testing app compiled
 *          last wrote to its `OutboxFake` and what `deliverRemoteEvent` received, delivers each occurrence once to its
 *          listeners, drains the bus, and repeats until nothing is left, so a chain of reactions settles.
 * Boundary: works through the port fake, never `@stackra/outbox`; an app whose `EventOutbox` is another driver is
 *           refused. An occurrence whose id the inbox has already delivered runs no listener. A listener failure is
 *           returned and kept for `app.listeners.failures`, never thrown.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decisions 2 and 4); ADR 0141 (decision 3).
 */
import { Event } from "#core/index";
import type { ListenerDelivery } from "#core/index";
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
  const { bus, outbox, inbox, seen } = currentHarness();
  if (!(outbox instanceof OutboxFake))
    throw new TypeError(
      `drainOutbox needs the outbox fake, but the app binds ${outbox.constructor.name}: ` +
        "use .override(EventOutbox, new OutboxFake())",
    );
  const deliveries: ListenerDelivery[] = [];
  for (;;) {
    const pending = [...outbox.take(), ...inbox.splice(0)];
    for (const { event, meta } of pending) {
      if (!(event instanceof Event))
        throw new TypeError(`The outbox holds ${String(event)}, which is not an event`);
      if (meta.id !== undefined) {
        if (seen.has(meta.id)) continue;
        seen.add(meta.id);
      }
      bus.deliver(event, meta);
    }
    const ran = await bus.drain();
    deliveries.push(...ran);
    if (pending.length === 0 && ran.length === 0) return deliveries;
  }
}
