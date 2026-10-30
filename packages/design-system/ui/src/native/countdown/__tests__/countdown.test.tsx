/**
 * Stackra file contract:
 * Purpose: proves the native Countdown reads as a timer named by its label and the time in words, and announces the
 *          end once.
 * Boundary: react-native is the DOM stand-in of `#testing/fakes/native-dom` with a spied announcer; fake timers.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { Countdown } from "#native/countdown/countdown";

const said = vi.hoisted(() => [] as string[]);

vi.mock("react-native", async () => ({
  ...(await import("#testing/fakes/native-dom")).nativeDom,
  AccessibilityInfo: { announceForAccessibility: (text: string) => said.push(text) },
}));
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);

describe("Countdown (native)", () => {
  it("names the timer and announces the end", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-29T10:00:00Z"));
    render(<Countdown label="Boarding closes" to="2026-10-29T10:02:00Z" />);
    expect(screen.getByRole("timer", { name: "Boarding closes, 2 minutes left" })).toBeTruthy();
    act(() => vi.advanceTimersByTime(121_000));
    expect(said.at(-1)).toBe("Time is up");
    vi.useRealTimers();
  });
});
