/**
 * Stackra file contract:
 * Purpose: proves `idleTimer` runs `onIdle` once after the timeout with no touch, restarts on each touch, stops for
 *          good on `stop`, and refuses a timeout that is not a positive number.
 * Boundary: test only; fake timers.
 * Runtime: node
 * Governing contract: ADR 0428 (decision 1); ADR 0022 (test placement).
 */
import { idleTimer } from "#core/functions/idle-timer.function";

describe("idleTimer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs onIdle once after the timeout, and restarts on a touch", () => {
    const onIdle = vi.fn();
    const timer = idleTimer(1000, onIdle);
    vi.advanceTimersByTime(900);
    timer.touch();
    vi.advanceTimersByTime(900);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onIdle).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(5000);
    expect(onIdle).toHaveBeenCalledOnce();
    timer.stop();
  });

  it("stops for good", () => {
    const onIdle = vi.fn();
    idleTimer(1000, onIdle).stop();
    vi.advanceTimersByTime(2000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it("refuses a timeout that is not positive", () => {
    expect(() => idleTimer(0, vi.fn())).toThrow(RangeError);
  });
});
