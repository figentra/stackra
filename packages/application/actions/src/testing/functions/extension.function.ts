/**
 * Stackra file contract:
 * Purpose: `extension(Point, "slot", { order }, handle)`, an inline implementer of one slot for a testing module's
 *          `.withExtensions([...])`, so a test exercises an owner's slot with stand-in extensions at chosen orders.
 * Boundary: test only; builds data and registers nothing. The slot name is checked against the point's slots and
 *           `handle` against the slot's signature at compile time.
 * Runtime: node
 * Governing contract: ADR 0305 (rules 23 and 25); ADR 0269 (testing helpers).
 */
import type { AnyClass } from "@stackra/container";

import type { ExtensionPoint, InlineExtension, SlotHandler } from "#core/index";
import type { SlotKey } from "#testing/types/slot-key.type";

/**
 * An inline implementer of `point`'s `slot`.
 *
 * @throws TypeError when `order` is not a whole number.
 * @example
 * createTestingModule(OrdersModule).withExtensions([
 *   extension(OrderExtensionPoint, "adjustTotals", { order: 10 }, (totals) => discounted(totals)),
 * ]);
 */
export function extension<P extends ExtensionPoint, K extends SlotKey<P>>(
  point: AnyClass<P>,
  slot: K,
  options: { readonly order?: number },
  handle: SlotHandler<P[K]>,
): InlineExtension {
  const order = options.order ?? 0;
  if (!Number.isInteger(order))
    throw new TypeError(
      `extension(${point.name}, "${slot}"): order must be a whole number, got ${order}`,
    );
  return Object.freeze({
    point,
    slot,
    order,
    handle: handle as unknown as (...args: never[]) => unknown,
  });
}
