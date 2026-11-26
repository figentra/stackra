/**
 * Stackra file contract:
 * Purpose: proves the web TerminalDemo is a region named by its label with a copy button for its command, plays its
 *          recorded lines a whole line per step and then shows its result, shows only the last frame with `never` and
 *          under reduced motion, hides lines still to come from assistive tech, and keeps the terminal left-to-right
 *          in Arabic while the label follows the page.
 * Boundary: jsdom with real HeroUI and fake timers; there is no IntersectionObserver, so `in-view` starts at once;
 *           `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { TerminalLine } from "#contracts/types/terminal-line.type";
import { TerminalDemo } from "#react/terminal-demo/terminal-demo";

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

const LINES: readonly TerminalLine[] = [
  { kind: "command", text: "stackra create my-app" },
  { kind: "output", text: "Checking the machine" },
  { kind: "success", text: "Created my-app" },
];

/** The lines assistive tech can read. */
const readable = () =>
  [...document.querySelectorAll("[data-kind]")].filter((line) => !line.hasAttribute("aria-hidden"));

describe("TerminalDemo (web)", () => {
  beforeEach(() => {
    state.isReduced = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a named region with a copy button and plays line by line to its result", () => {
    render(
      <TerminalDemo
        command="stackra create my-app"
        label="Try it"
        lines={LINES}
        result={<p>localhost:4000</p>}
        copyLabel="Copy command"
      />,
    );
    expect(screen.getByRole("region", { name: "Try it" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
    expect(screen.getByRole("log").getAttribute("aria-live")).toBe("off");
    expect(readable()).toHaveLength(0);
    expect(screen.queryByText("localhost:4000")).toBeNull();
    act(() => vi.advanceTimersByTime(80));
    expect(readable()).toHaveLength(1);
    // One step per act: each step's effect schedules the next only after it renders.
    act(() => vi.advanceTimersByTime(80));
    act(() => vi.advanceTimersByTime(80));
    expect(readable()).toHaveLength(3);
    expect(screen.getByText("localhost:4000")).toBeTruthy();
  });

  it("shows the last frame only with never and under reduced motion", () => {
    const { unmount } = render(
      <TerminalDemo command="stackra verify" lines={LINES} autoplay="never" />,
    );
    expect(readable()).toHaveLength(3);
    unmount();
    state.isReduced = true;
    render(<TerminalDemo command="stackra verify" lines={LINES} isCopyable={false} />);
    expect(readable()).toHaveLength(3);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the terminal left-to-right in Arabic", () => {
    render(
      <I18nProvider locale="ar">
        <TerminalDemo command="stackra create my-app" label="جرّبه" lines={LINES} autoplay="never" />
      </I18nProvider>,
    );
    expect(screen.getByRole("region", { name: "جرّبه" })).toBeTruthy();
    expect(screen.getByRole("log").getAttribute("dir")).toBe("ltr");
    expect(document.querySelector("code")?.getAttribute("dir")).toBe("ltr");
  });
});
