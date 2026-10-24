/**
 * Stackra file contract:
 * Purpose: `fakeRealtime(options)`, the helper a test builds a realtime connection with: a `RealtimeFake`, live by
 *          default or at `options.status`, ready to bind in place of `RealtimeConnection` (the render helpers'
 *          `realtime` option, or `createTestingModule(...).override(RealtimeConnection, fake)`).
 * Boundary: test code only; opens no network.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); the template's tests (`fakeRealtime()`, `realtime.emit(OrderPaid, ...)`,
 *                     `realtime: { status }`).
 */
import type { RealtimeStatus } from "#core/index";
import { RealtimeFake } from "#testing/realtime.fake";

/**
 * A fake realtime connection.
 *
 * @example
 * const realtime = fakeRealtime();
 * renderRoute(Routes.orders, { realtime });
 * await act(() => realtime.emit(OrderPaid, { orderId }));
 */
export function fakeRealtime(options: { readonly status?: RealtimeStatus } = {}): RealtimeFake {
  return new RealtimeFake(options.status);
}
