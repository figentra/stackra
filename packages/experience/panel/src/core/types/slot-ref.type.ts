/**
 * Stackra file contract:
 * Purpose: `SlotRef`, one typed slot as the generated `#stackra/slots` names it (`Slots.Dashboard.Main`): its derived key
 *          and its place type.
 * Boundary: a type only; built by `slots({...})`. Two members' slot files agree by key, never by object identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18: slots are typed places); ADR 0294 (decision 20: derived identities).
 */
import type { Place } from "#core/enums/place.enum";

/** The reference to one typed slot widgets go into. */
export interface SlotRef {
  /** The snake_case dotted key (`dashboard.main`, `orders.order.view.aside`). */
  readonly key: string;

  /** The place type, which limits the displays the slot takes. */
  readonly place: Place;
}
