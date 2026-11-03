/**
 * Stackra file contract:
 * Purpose: proves the MonoDisplay is a section named by its wordmark (an `h2`, left-to-right and untranslated),
 *          raises its floors bottom to top a floor per floor step at the full motion level and draws them at once below
 *          it, draws the glyph field only with a poster, hides its art from assistive tech, and keeps the wordmark
 *          left-to-right in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui components and fake timers; matchMedia is stubbed and the motion
 *           level comes from the DesignSystemProvider; jsdom has no IntersectionObserver, so the floors start at once,
 *           and no canvas, so the field keeps its poster.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { MonoDisplay } from "#react/mono-display/mono-display";

/** One floor step of the theme. */
const STEP_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

/** The block at a motion level, in a locale. */
const at = (motion: "full" | "reduced", children: ReactNode, locale = "en") => (
  <DesignSystemProvider motion={motion} locale={locale} hasShortcutCheatSheet={false}>
    {children}
  </DesignSystemProvider>
);

/** How many floors are drawn. */
const risen = () =>
  [...document.querySelectorAll('[data-slot="mono-display-floor"]')].filter(
    (floor) => !floor.classList.contains("invisible"),
  ).length;

describe("MonoDisplay", () => {
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

  it("is a section named by its wordmark whose floors rise a step at a time", () => {
    render(at("full", <MonoDisplay title="stackra" tagline="One backend, every surface." />));
    expect(screen.getByRole("region", { name: "stackra" })).toBeTruthy();
    const heading = screen.getByRole("heading", { level: 2, name: "stackra" });
    expect(heading.querySelector("span")?.getAttribute("translate")).toBe("no");
    expect(screen.getByText("One backend, every surface.")).toBeTruthy();
    expect(risen()).toBe(0);
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(risen()).toBe(1);
    act(() => vi.advanceTimersByTime(2 * STEP_MS));
    expect(risen()).toBe(3);
  });

  it("draws every floor at once below the full motion level", () => {
    render(at("reduced", <MonoDisplay title="stackra" />));
    expect(risen()).toBe(3);
  });

  it("draws the glyph field hidden, only with a poster", () => {
    const { container, unmount } = render(
      at("reduced", <MonoDisplay title="stackra" art="glyphs" poster="/glyphs.png" />),
    );
    expect(container.querySelector('[data-slot="dither-art"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(risen()).toBe(0);
    unmount();
    const bare = render(at("reduced", <MonoDisplay title="stackra" art="glyphs" />));
    expect(bare.container.querySelector('[data-slot="dither-art"]')).toBeNull();
  });

  it("keeps the wordmark left-to-right in Arabic", () => {
    render(at("reduced", <MonoDisplay title="stackra" tagline="خلفية واحدة." />, "ar"));
    expect(document.documentElement.dir).toBe("rtl");
    const heading = screen.getByRole("heading", { level: 2, name: "stackra" });
    expect(heading.querySelector("span")?.getAttribute("dir")).toBe("ltr");
  });
});
