/**
 * Stackra file contract:
 * Purpose: `AutomationStart`, what starts a published automation's run: a trigger event's delivery or a schedule's
 *          tick, kept on the skip a quota records.
 * Boundary: an `Enum.of` value plus the type of the same name.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3); ADR 0153 (decision 1); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * How a run is started.
 * @example
 * await automations.triggered("orders.order_paid", AutomationStart.Event);
 */
export const AutomationStart = Enum.of({
  /** A trigger block's event, delivered through the event bus (and the outbox, which redelivers on a throw). */
  Event: "event",
  /** A schedule's tick. */
  Schedule: "schedule",
});

/** One of the codes above. */
export type AutomationStart = Enum.Value<typeof AutomationStart>;
