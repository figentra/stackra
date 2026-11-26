/**
 * Stackra file contract:
 * Purpose: `TicketService`, the example service of the "Tenancy in an app" guide: it opens, lists and resolves
 *          tickets with no tenant in any argument or filter, because the row-level security policy, not the code,
 *          keeps each tenant to its own rows.
 * Boundary: runs inside the caller's tenant call (the action pipeline's `CallIsolation`, or `asTenant` in a test);
 *           outside one, Postgres sees no tenant and refuses the insert.
 * Runtime: node
 * Governing contract: ADR 0239 (isolation in the database, never an application filter); ADR 0327 (decision 9);
 *                     ADR 0105 as amended by ADR 0294; STA-2843.
 */
import { SortDirection } from "@stackra/contracts";
import { CrudService } from "@stackra/database";

import type { Ticket } from "./ticket.model";

/** The support module's reads and writes. No method takes a tenant. */
export class TicketService extends CrudService<Ticket> {
  /** Opens a ticket for the running call's tenant. */
  open(subject: string): Promise<Ticket> {
    return this.insert({ subject });
  }

  /** The running tenant's open tickets, oldest first. */
  waiting(): Promise<Ticket[]> {
    return this.find({ status: "open" }, { orderBy: { createdAt: SortDirection.Asc } });
  }

  /** Resolves one of the running tenant's tickets; another tenant's id is `not_found`. */
  resolve(id: Ticket["id"]): Promise<Ticket> {
    return this.update({ id }, { status: "resolved" });
  }
}
