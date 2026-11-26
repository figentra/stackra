/**
 * Stackra file contract:
 * Purpose: `TicketPermissions`, the example permission set of the "Sign-in and permissions" guide:
 *          `support.ticket.<verb>`, each with its risk.
 * Boundary: statics only; the value is the risk. Gen derives each key from the module, the class (minus `Permissions`)
 *           and the static, as an app's `src/modules/support/access/ticket.permissions.ts` would declare them.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (names); ADR 0099 (risk); ADR 0294; STA-2852.
 */
import { Permission, Permissions } from "@stackra/iam";

/** Who may read, answer and close support tickets. */
export class TicketPermissions extends Permissions {
  /** Read a ticket. */
  static readonly read = Permission.L0;

  /** Answer a ticket. */
  static readonly reply = Permission.L1;

  /** Close a ticket. */
  static readonly close = Permission.L2;
}
