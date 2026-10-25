/**
 * Stackra file contract:
 * Purpose: `SystemRole`, the platform's built-in role codes: the roles a scope's defaults are provisioned with and the
 *          `roles` a widget, a menu or a dashboard names to shape presentation (`roles: [SystemRole.Owner]`).
 * Boundary: an `Enum.of` value plus the type of the same name. A code is a role key a grant may name; its permissions
 *           are the snapshot's (provisioned as data), and as a system role it may hold a wildcard (ADR 0132 decision
 *           5). Presentation roles never grant or remove a permission (ADR 0273 decision 2). Module roles are
 *           `Role({ grants })` classes, not codes here.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2); ADR 0273 (as amended by 0294); ADR 0294 (decision 16: `Enum.of`).
 */
import { Enum } from "@stackra/contracts";

/**
 * The built-in roles.
 *
 * @example
 * export class OrderKpisWidget extends Widget<OrderKpisQuery>({ roles: [SystemRole.Owner, SystemRole.Manager] }) {}
 */
export const SystemRole = Enum.of({
  /** Holds everything at its node, provisioned with the wildcard. */
  Owner: "owner",
  /** Runs the day-to-day work of its node. */
  Manager: "manager",
  /** Does the ordinary work of its node. */
  Staff: "staff",
});

/** One of the codes above. */
export type SystemRole = Enum.Value<typeof SystemRole>;
