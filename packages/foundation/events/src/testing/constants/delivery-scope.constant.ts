/**
 * Stackra file contract:
 * Purpose: `DELIVERY_SCOPE`, the delivery scope `deliverEventsIn` registered, which `drainOutbox()` runs each event's
 *          delivery in (STA-1789).
 * Boundary: set once when a package's testing entry loads (`@stackra/database`'s); undefined when none did, and
 *           then `drainOutbox()` delivers in no transaction or scope. Internal: not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { DeliveryScope } from "#testing/types/delivery-scope.type";

/** The registered delivery scope, if any. */
export const DELIVERY_SCOPE: { value: DeliveryScope | undefined } = { value: undefined };
