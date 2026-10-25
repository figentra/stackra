/**
 * Stackra file contract:
 * Purpose: `LOYALTY_KIT_SLOTS`, the slot refs the kit's widgets name (`LOYALTY_KIT_SLOTS.Dashboard.Main` is the slot
 *          `dashboard.main`, a grid).
 * Boundary: internal; not exported from an entry. The stand-in for gen's `#stackra/slots` `Slots` tree, built with the
 *           same `slots()` helper; slots agree by key, so a host's generated `Slots.Dashboard.Main` is the same slot.
 *           Delete it with STA-339.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 18: slots are typed places); ADR 0294 (decision 20: derived identities).
 */
import { slots } from "@stackra/panel";

/** The host dashboard's main grid. */
export const LOYALTY_KIT_SLOTS = slots({ Dashboard: ["Main"] });
