/**
 * Stackra file contract:
 * Purpose: `TicketRequesterRole`, an example module role of the "Sign-in and permissions" guide: a customer reads and
 *          closes tickets, their own only by the ticket policy.
 * Boundary: grants only, as an app's `src/modules/support/access/ticket-requester.role.ts` would declare them; gen
 *           derives the key `support.ticket_requester`. Who holds the role where is data in IAM, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (roles bundle permissions); ADR 0132; STA-2852.
 */
import { Role } from "@stackra/iam";

import { TicketPermissions } from "./ticket.permissions";

/** Customers who open tickets. */
export class TicketRequesterRole extends Role({
  grants: [TicketPermissions.read, TicketPermissions.close],
}) {}
