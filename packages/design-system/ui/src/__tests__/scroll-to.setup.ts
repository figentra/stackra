/**
 * Stackra file contract:
 * Purpose: gives jsdom's elements the `scrollTo` it lacks. react-aria scrolls a menu's or list's focused item into
 *          view on an animation frame, and on a slow runner that frame lands while a test is still running, throwing
 *          "scrollView.scrollTo is not a function" as an unhandled error that fails the run (#181, 2026-10-30).
 * Boundary: test support only; vitest loads it through `setupFiles` before every test file. Node-environment tests
 *           have no `Element` and are left alone.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); ADR 0182 (testing strategy).
 */
if (typeof Element !== "undefined" && typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = () => undefined;
}
