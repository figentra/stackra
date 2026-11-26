/**
 * Stackra file contract:
 * Purpose: `SupportAgentRole`, an example module role of the "Sign-in and permissions" guide: an agent reads, answers
 *          and closes tickets.
 * Boundary: grants only, as an app's `src/modules/support/access/support-agent.role.ts` would declare them; gen derives
 *           the key `support.support_agent`. Who holds the role where is data in IAM, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (roles bundle permissions); ADR 0132; STA-2852.
 */
import { Role } from "@stackra/iam";

import { TicketPermissions } from "./ticket.permissions";

/** Staff who work the support queue. */
export class SupportAgentRole extends Role({
  grants: [TicketPermissions.read, TicketPermissions.reply, TicketPermissions.close],
}) {}
