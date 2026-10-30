/**
 * Stackra file contract:
 * Purpose: proves the web Countdown is a named timer showing hh:mm:ss, ticks each second, says the time politely in
 *          words to the minute, and at zero says "Time is up" and calls `onComplete` once; and a stopwatch counts up.
 * Boundary: jsdom with fake timers; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { Countdown } from "#react/countdown/countdown";

describe("Countdown (web)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-29T10:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("counts down, announces to the minute, and completes once", () => {
    const done = vi.fn();
    const { container } = render(
      <Countdown label="Offer ends in" to="2026-10-29T11:01:02Z" onComplete={done} />,
    );
    expect(screen.getByRole("timer", { name: "Offer ends in" })).toBeTruthy();
    expect(container.querySelector("bdi")?.textContent).toBe("01:01:02");
    expect(container.querySelector("[aria-live]")?.textContent).toBe("1 hour, 1 minute left");
    act(() => vi.advanceTimersByTime(1000));
    expect(container.querySelector("bdi")?.textContent).toBe("01:01:01");
    act(() => vi.advanceTimersByTime(3_700_000));
    expect(container.querySelector("[aria-live]")?.textContent).toBe("Time is up");
    expect(done).toHaveBeenCalledTimes(1);
  });

  it("counts up as a stopwatch", () => {
    const { container } = render(<Countdown mode="stopwatch" label="Call time" />);
    act(() => vi.advanceTimersByTime(65_000));
    expect(container.querySelector("bdi")?.textContent).toBe("00:01:05");
  });
});
