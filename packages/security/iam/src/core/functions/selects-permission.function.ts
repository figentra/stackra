/**
 * Stackra file contract:
 * Purpose: `selectsPermission(selector, key)`, whether a permission selector held in a role covers a registered
 *          permission key: `@read` (every read: risk `l0` or `l1`) or `@risk:<level>` (every permission at that risk),
 *          each optionally narrowed to a module or model prefix (`orders.@read`, `orders.order.@risk:l2`).
 * Boundary: pure over `PERMISSION_REGISTRY` and internal. A selector picks only registered permissions, and never a
 *           system permission (only the platform holds those) or a restricted one (it counts only as an explicit key
 *           someone else granted), so a selector can never reach further than naming the keys by hand would. A deny
 *           rule's selector picks them too, because a deny only ever takes access away. Anything that is not a selector
 *           selects nothing. Which roles hold which selector is data (custom and provisioned
 *           roles in the snapshot), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (decisions 2 and 5); ADR 0099 (the risk levels); ADR 0407; STA-818.
 */
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { Risk } from "#core/enums/risk.enum";

/** `[<prefix>.]@read` or `[<prefix>.]@risk:<level>`. */
const SELECTOR = /^(?:((?:[a-z][a-z0-9_]*\.){1,2}))?@(?:(read)|risk:(l[0-4]))$/;

/** The levels a read selector picks. */
const READ: ReadonlySet<string> = new Set([Risk.L0, Risk.L1]);

/**
 * Whether `selector` picks `key`; with `deny`, system and restricted permissions are picked too (a deny may only narrow).
 *
 * @example
 * selectsPermission("@read", "orders.order.read"); // true when it is registered at L0 or L1
 * selectsPermission("orders.@risk:l3", "orders.refund.issue"); // true when it is registered at L3
 */
export function selectsPermission(selector: string, key: string, deny = false): boolean {
  const match = SELECTOR.exec(selector);
  if (match === null) return false;
  const [, prefix, read, level] = match;
  if (prefix !== undefined && !key.startsWith(prefix)) return false;
  const permission = PERMISSION_REGISTRY.get(key);
  if (permission === undefined) return false;
  if (!deny && (permission.isSystem || permission.isRestricted)) return false;
  return read === undefined ? permission.risk === level : READ.has(permission.risk);
}
