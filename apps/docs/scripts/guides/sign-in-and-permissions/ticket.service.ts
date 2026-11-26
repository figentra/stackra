/**
 * Stackra file contract:
 * Purpose: `TicketService`, the example service of the "Sign-in and permissions" guide: it reads one ticket and closes
 *          it. Who may do either is the action pipeline's and the policy's question, never this service's.
 * Boundary: data access only, as an app's `src/modules/support/services/ticket.service.ts` would hold it; the guide's
 *           tests stand a recording double in for it, since storing tickets is the "Models and migrations" guide's.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; STA-2852.
 */
import { CrudService } from "@stackra/database";

import type { Ticket } from "./ticket.model";

/** The support module's ticket reads and writes. No method checks a permission. */
export class TicketService extends CrudService<Ticket> {
  /** The ticket `id`; `not_found` when there is none. */
  get(id: Ticket["id"]): Promise<Ticket> {
    return this.findOneOrFail({ id });
  }

  /** Marks the ticket closed. */
  close(id: Ticket["id"]): Promise<Ticket> {
    return this.update({ id }, { status: "closed" });
  }
}
