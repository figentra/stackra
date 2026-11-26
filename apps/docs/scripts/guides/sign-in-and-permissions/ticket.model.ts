/**
 * Stackra file contract:
 * Purpose: `Ticket`, the example model of the "Sign-in and permissions" guide: a support ticket a customer opened
 *          (key `support.ticket`, public ids `tkt_…`), whose `customerId` the ticket policy reads.
 * Boundary: data only, as an app's `src/modules/support/models/ticket.model.ts` would hold it; the guide page copies
 *           its code from this file and the guide's tests run it.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0132 (record rules read the record); STA-2852.
 */
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";

/** A question one customer asked. */
export class Ticket extends Model.with(HasPublicId("tkt")) {
  /** The customer who opened it. */
  customerId!: PublicId<"usr">;

  /** `open` until someone closes it, then `closed`. */
  status = "open";
}
