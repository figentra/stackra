/**
 * Stackra file contract:
 * Purpose: `wireVersionOf(wireName)`, an integration event's wire name split into its base and version
 *          (`orders.order.paid.v2` is `orders.order.paid` and 2), and the class this process registers under that base
 *          with its current version, so the inbox can read another version of a known event.
 * Boundary: internal (not in a barrel); reads the `EVENT_NAMES` registry only. A registered name is its class's
 *           current version as it is; another `.v<n>` of a registered base is that class with the version it carries;
 *           anything else is `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (decision 1 and the 2026-10-23 note); ADR 0118 (2026-10-23 note).
 */
import type { EventClass } from "@stackra/events";

import { EVENT_NAMES } from "#core/constants/event-names.constant";

/** `<base>.v<n>`. */
const WIRE_NAME = /^(.+)\.v([1-9]\d*)$/;

/**
 * The version `wireName` carries, with the registered class of its base and that class's own version.
 *
 * @example
 * wireVersionOf("orders.order.paid.v1"); // { type: OrderPaid, version: 1, current: 2 } once v2 is registered
 */
export function wireVersionOf(
  wireName: string,
): { readonly type: EventClass; readonly version: number; readonly current: number } | undefined {
  const exact = EVENT_NAMES.byName.get(wireName) as EventClass | undefined;
  if (exact !== undefined) {
    const version = Number(WIRE_NAME.exec(wireName)?.[2] ?? 1);
    return { type: exact, version, current: version };
  }
  const match = WIRE_NAME.exec(wireName);
  if (match === null) return undefined;
  const [, base, version] = match as unknown as [string, string, string];
  for (const [name, type] of EVENT_NAMES.byName) {
    const registered = WIRE_NAME.exec(name);
    if (registered?.[1] === base)
      return { type: type as EventClass, version: Number(version), current: Number(registered[2]) };
  }
  return undefined;
}
