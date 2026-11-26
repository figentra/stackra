/**
 * Stackra file contract:
 * Purpose: `Ticket`, the example model of the "Tenancy in an app" guide: a support ticket one tenant owns, one row of
 *          `support.tickets` (key `support.ticket`, public ids `tkt_…`). `BelongsToTenant` gives it `tenantId`, filled
 *          from the running tenant call, never from input.
 * Boundary: data only, as an app's `src/modules/support/models/ticket.model.ts` would hold it; the guide page copies
 *           its code from this file and the guide's tests run it.
 * Runtime: node
 * Governing contract: ADR 0239 (tenant isolation); ADR 0321 and ADR 0323 (decision 3: `BelongsToTenant` is tenancy's);
 *                     ADR 0294; STA-2843.
 */
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";
import { Str } from "@stackra/validation";

/** A question one customer of one tenant asked. */
export class Ticket extends Model.with(HasPublicId("tkt"), BelongsToTenant, Timestamps) {
  /** What the customer asked about. */
  @Str({ max: 200 })
  subject!: string;

  /** `open` until someone answers it, then `resolved`. */
  status = "open";
}
