/**
 * Stackra file contract:
 * Purpose: `TicketService`, the example service of the "Notifications" guide: it reads the ticket a notification
 *          renders.
 * Boundary: data access only, as an app's `src/modules/support/services/ticket.service.ts` would hold it; the guide's
 *           tests stand a double in for it, since storing tickets is the "Models and migrations" guide's.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; STA-2852.
 */
import { CrudService } from "@stackra/database";

import type { Ticket } from "./ticket.model";

/** The support module's ticket reads. */
export class TicketService extends CrudService<Ticket> {
  /** The ticket `id`; `not_found` when there is none. */
  get(id: Ticket["id"]): Promise<Ticket> {
    return this.findOneOrFail({ id });
  }
}
