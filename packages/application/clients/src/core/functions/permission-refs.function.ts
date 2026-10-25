/**
 * Stackra file contract:
 * Purpose: `permissionRefs`, the name the console's generated clients use for `permissionsRef`; the same function.
 * Boundary: an alias kept until gen writes one name in every target (STA-339); no behaviour of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0261 (generated `#stackra/clients`).
 */
import { permissionsRef } from "#core/functions/permissions-ref.function";

// shortcut: two names for one factory because two gen revisions emit both; drop the alias once gen settles on one (STA-339).
/**
 * A consumed permission set class.
 *
 * @example
 * export class StockPermissions extends permissionRefs("inventory.stock", ["read", "manage"]) {}
 */
export const permissionRefs = permissionsRef;
