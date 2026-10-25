/**
 * Stackra file contract:
 * Purpose: `fakeAnalytics()`, the analytics a test starts from: a fresh `AnalyticsFake` with nothing decided, handed to
 *          a render helper (`render(ui, { analytics })`, `renderRoute(route, { analytics })`) and read back with
 *          `events()`, `tracked`, `state` and `delivered()`.
 * Boundary: test code only; two calls never share consent, queue or records.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0266; ADR 0298.
 */
import { AnalyticsFake } from "#testing/analytics.fake";

/**
 * A fresh analytics fake.
 *
 * @example
 * const analytics = fakeAnalytics();
 * render(<ConsentBanner />, { locale: "en", analytics });
 * await userEvent.click(screen.getByRole("button", { name: "Only necessary" }));
 * expect(analytics.state).toBe("opted_out");
 */
export function fakeAnalytics(): AnalyticsFake {
  return new AnalyticsFake();
}
