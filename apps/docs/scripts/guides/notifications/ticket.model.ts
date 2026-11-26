/**
 * Stackra file contract:
 * Purpose: `Ticket`, the example model of the "Notifications" guide: a support ticket (key `support.ticket`, public ids
 *          `tkt_…`) whose subject the answer notification reads.
 * Boundary: data only, as an app's `src/modules/support/models/ticket.model.ts` would hold it; the guide page copies
 *           its code from this file and the guide's tests run it.
 * Runtime: node
 * Governing contract: ADR 0294; STA-2852.
 */
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model } from "@stackra/model";
import { Str } from "@stackra/validation";

/** A question one customer asked. */
export class Ticket extends Model.with(HasPublicId("tkt")) {
  /** What the customer asked about. */
  @Str({ max: 200 })
  subject!: string;

  /** The customer who opened it. */
  customerId!: PublicId<"usr">;
}
