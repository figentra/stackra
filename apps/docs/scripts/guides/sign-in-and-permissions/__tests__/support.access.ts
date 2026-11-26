/**
 * Stackra file contract:
 * Purpose: the stand-in for what `stackra gen` writes for the guide's `support` module in an app's entry: the derived
 *          permission keys (`registerPermissions`), the module roles (`registerRoles`), the ticket policy
 *          (`registerPolicies`) and the action's locked key and permission (`registerActions`).
 * Boundary: test support only; loading it fills the registries once, in gen's order (permissions before roles).
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 15: gen writes the registrations); ADR 0208; ADR 0132; STA-2852.
 */
import { registerActions } from "@stackra/actions";
import { registerPermissions } from "@stackra/container";
import { registerPolicies, registerRoles } from "@stackra/iam";

import { CloseTicketAction } from "../close-ticket.action";
import { SupportAgentRole } from "../support-agent.role";
import { Ticket } from "../ticket.model";
import { TicketPermissions } from "../ticket.permissions";
import { TicketPolicy } from "../ticket.policy";
import { TicketRequesterRole } from "../ticket-requester.role";

registerPermissions([
  {
    type: TicketPermissions,
    keys: {
      read: "support.ticket.read",
      reply: "support.ticket.reply",
      close: "support.ticket.close",
    },
  },
]);
registerRoles([
  { type: SupportAgentRole, key: "support.support_agent" },
  { type: TicketRequesterRole, key: "support.ticket_requester" },
]);
registerPolicies([{ model: Ticket, policy: TicketPolicy }]);
registerActions([
  { type: CloseTicketAction, key: "support.ticket.close@1", permission: "support.ticket.close" },
]);
