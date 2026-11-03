/**
 * Stackra file contract:
 * Purpose: proves the TerminalDemoBlock plays its recording a whole line per step to the done mark the monitor waits
 *          on, shows the last frame at once below the full motion level, keeps its art and monitor hidden from
 *          assistive tech, and keeps the terminal left-to-right in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and fake timers; matchMedia is stubbed and the motion
 *           level comes from the DesignSystemProvider; jsdom has no IntersectionObserver, so the session starts at once,
 *           and no canvas, so the art keeps its poster.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import type { TerminalLine } from "@stackra/ui/contracts";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { TerminalDemoBlock } from "#react/terminal-demo-block/terminal-demo-block";

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

describe("TerminalDemoBlock", () => {
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
        <TerminalDemoBlock
          command="stackra create my-app"
          lines={LINES}
          label="Try it"
          art={{ poster: "/strata.png" }}
          monitorArt="/monitor.svg"
        />,
      ),
    );
    const terminal = screen.getByRole("region", { name: "Try it" });
    expect(terminal.hasAttribute("data-done")).toBe(false);
    expect(terminal.className).toContain("peer");
    act(() => vi.advanceTimersByTime(160));
    expect(terminal.hasAttribute("data-done")).toBe(true);
    const monitor = container.querySelector('[data-slot="terminal-demo-block-monitor"]');
    expect(monitor?.getAttribute("src")).toBe("/monitor.svg");
    expect(monitor?.getAttribute("alt")).toBe("");
    expect(monitor?.className).toContain("peer-data-done:visible");
    expect(container.querySelector('[data-slot="dither-art"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Copy command" })).toBeTruthy();
  });

  it("shows the last frame at once below the full motion level", () => {
    render(
      at("reduced", <TerminalDemoBlock command="stackra verify" lines={LINES} label="Try it" />),
    );
    expect(screen.getByRole("region", { name: "Try it" }).hasAttribute("data-done")).toBe(true);
    expect(screen.getByText("Created my-app")).toBeTruthy();
  });

  it("keeps the terminal left-to-right in Arabic", () => {
    render(
      at(
        "reduced",
        <TerminalDemoBlock command="stackra create my-app" lines={LINES} label="جرّبه" />,
        "ar",
      ),
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("region", { name: "جرّبه" })).toBeTruthy();
    expect(screen.getByRole("log").getAttribute("dir")).toBe("ltr");
  });
});
