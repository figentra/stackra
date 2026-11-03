/**
 * Stackra file contract:
 * Purpose: proves the TerminalStage plays its recording a whole line per step to the done mark the monitor waits
 *          on (one act a line, so each line's effect schedules the next), draws no log and shows the monitor at
 *          once before there is a recording, shows the last frame at once below the full motion level, keeps its art
 *          and monitor hidden from
 *          assistive tech, and keeps the terminal left-to-right in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and fake timers; matchMedia is stubbed and the motion
 *           level comes from the DesignSystemProvider; jsdom has no IntersectionObserver, so the session starts at once,
 *           and no canvas, so the art keeps its poster.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import type { TerminalLine } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TerminalStage } from "#react/terminal-stage/terminal-stage";

/** One floor step of the theme: one line. */
const STEP_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

const LINES: readonly TerminalLine[] = [
  { kind: "command", text: "stackra create my-app" },
  { kind: "success", text: "Created my-app" },
];

/** The block at a motion level, in a locale. */
const at = (motion: "full" | "reduced", children: ReactNode, locale = "en") => (
  <DesignSystemProvider motion={motion} locale={locale} hasShortcutCheatSheet={false}>
    {children}
  </DesignSystemProvider>
);

describe("TerminalStage", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => null,
      configurable: true,
    });
  });
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("plays line by line to the done mark, over hidden art and a hidden monitor", () => {
    const { container } = render(
      at(
        "full",
        <TerminalStage
          command="stackra create my-app"
          lines={LINES}
          label="Try it"
          art={{ poster: "/strata.png" }}
          monitor={{ src: "/art/monitor", width: 328, height: 426 }}
        />,
      ),
    );
    const terminal = screen.getByRole("region", { name: "Try it" });
    expect(terminal.hasAttribute("data-done")).toBe(false);
    expect(terminal.className).toContain("peer");
    // One act a line: each line renders before its effect schedules the next.
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(terminal.hasAttribute("data-done")).toBe(false);
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(terminal.hasAttribute("data-done")).toBe(true);
    const monitor = container.querySelector('[data-slot="terminal-stage-monitor"]');
    expect(monitor?.className).toContain("peer-data-done:visible");
    expect(monitor?.querySelector("img")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector('[data-slot="dither-art"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
  });

  it("draws no log before there is a recording, only the command bar and the monitor", () => {
    const { container } = render(
      at(
        "full",
        <TerminalStage
          command="stackra create my-app"
          lines={[]}
          label="Try it"
          monitor={{ src: "/art/monitor", width: 328, height: 426 }}
        />,
      ),
    );
    const terminal = screen.getByRole("region", { name: "Try it" });
    expect(terminal.hasAttribute("data-done")).toBe(true);
    expect(terminal.className).toContain("[&_[role=log]]:hidden");
    expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
    expect(container.querySelector('[data-slot="terminal-stage-monitor"]')?.className).toContain(
      "peer-data-done:visible",
    );
    expect(container.querySelectorAll('[data-slot="blueprint-section"]')).toHaveLength(1);
  });

  it("draws the log once there is a recording", () => {
    render(at("reduced", <TerminalStage command="stackra verify" lines={LINES} label="Try it" />));
    expect(screen.getByRole("region", { name: "Try it" }).className).not.toContain("[role=log]");
  });

  it("shows the last frame at once below the full motion level", () => {
    render(at("reduced", <TerminalStage command="stackra verify" lines={LINES} label="Try it" />));
    expect(screen.getByRole("region", { name: "Try it" }).hasAttribute("data-done")).toBe(true);
    expect(screen.getByText("Created my-app")).toBeTruthy();
  });

  it("keeps the terminal left-to-right in Arabic", () => {
    render(
      at(
        "reduced",
        <TerminalStage command="stackra create my-app" lines={LINES} label="جرّبه" />,
        "ar",
      ),
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("region", { name: "جرّبه" })).toBeTruthy();
    expect(screen.getByRole("log").getAttribute("dir")).toBe("ltr");
  });
});
