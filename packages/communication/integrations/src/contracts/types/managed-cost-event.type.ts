/**
 * Stackra file contract:
 * Purpose: `ManagedCostEvent`, one cost a managed resource ran up on Figentra's platform account (a 10DLC brand fee,
 *          a month of a phone number, an EDI document): the meter row usage metering bills on the rate card.
 * Boundary: a type only; `ManagedProvisioning.costs` returns them and the host writes them to usage metering. The meter
 *           name and the amount are the provider's facts; the price the tenant pays is the rate card's
 *           (`rate-card:<category>`), never computed here.
 * Runtime: isomorphic
 * Governing contract: R3-SO-03 (cost events); R3-CE-13 (managed rate card); config-model (prices are data).
 */
import type { Money } from "@stackra/money";

/**
 * A pass-through cost.
 *
 * @example
 * for (const cost of await provisioning.costs(resource.id, since)) await meter.record(cost);
 */
export interface ManagedCostEvent {
  /** The event's own id, so a repeated read records it once. */
  readonly id: string;

  /** The managed resource that ran it up. */
  readonly resourceId: string;

  /** The provider category. */
  readonly category: string;

  /** The Integration's provider code. */
  readonly provider: string;

  /** The meter it counts on (`brand_registration`, `number_month`, `document`). */
  readonly meter: string;

  /** How many units. */
  readonly quantity: number;

  /** What the provider charged Figentra, when it says. */
  readonly cost?: Money;

  /** When it happened. */
  readonly occurredAt: Date;
}
