/**
 * Stackra file contract:
 * Purpose: proves the HeroMachine is a blueprint region named by its `h1`, with the primary link, the copy link
 *          and the command reachable in order from the keyboard, the machine at the inline end (a group named by its
 *          label: the action's file in a schematic window piped into a frame per surface, each an image of its button
 *          with no focusable control, an Arabic one right to left), the band unclipped so its marks show whole, the
 *          pipe drawing in on floor steps at the `full` motion level and drawn at once below it, the engine drawing
 *          decorative unless it has `alt` and never mirrored in Arabic, and the dither horizon that drifts at the
 *          `full` motion level and stands still below it.
 * Boundary: unit tier, jsdom, the real @stackra/ui components. The locale and the motion level come from
 *           `DesignSystemProvider` (this package cannot reach react-aria-components or Motion directly); jsdom has no
 *           matchMedia, canvas or animation frames, so those are stand-ins; it has no layout or IntersectionObserver,
 *           so the machine starts at once and its pipes measure at the origin.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { DesignSystemProvider } from "@stackra/ui/react";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { HeroMachine } from "#react/hero-machine/hero-machine";
import type { HeroMachineProps } from "#react/hero-machine/hero-machine.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const frame = vi.fn(() => 1);

/** One floor step of the theme: one pipe segment. */
const STEP_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

const PROPS: HeroMachineProps = {
  title: "One backend, every surface.",
  lede: "Write an action once.",
  primary: { label: "Read the docs", href: "/docs" },
  copyLink: { label: "Copy llms.txt", value: "https://stackra.dev/llms.txt" },
  command: "stackra create my-app",
  art: { src: "/landing/art/engine", width: 505, height: 588 },
  horizon: { poster: "/strata-dark.png", sun: { x: 0.8, y: 1 } },
  machine: {
    label: "One action, every surface",
    action: { filename: "cancel-order.action.ts", code: "export class CancelOrderAction {}" },
    surfaces: [
      { id: "web", kind: "web", title: "orders.example", button: "Cancel order" },
      { id: "desktop", kind: "desktop", title: "Orders", button: "Cancel order" },
      { id: "phone", kind: "phone", title: "Phone", button: "إلغاء الطلب", lang: "ar" },
    ],
  },
};

/** Renders `node` under the provider at a locale and a motion level. */
const draw = (
  node: ReactElement,
  {
    locale = "en",
    motion = "full",
  }: { locale?: string; motion?: "full" | "reduced" | "none" } = {},
) =>
  render(
    <DesignSystemProvider locale={locale} motion={motion} hasShortcutCheatSheet={false}>
      {node}
    </DesignSystemProvider>,
  );

describe("HeroMachine", () => {
  beforeEach(() => {
    frame.mockClear();
    vi.stubGlobal("requestAnimationFrame", frame);
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => ({ fillStyle: "", fillRect: vi.fn() }),
      configurable: true,
    });
  });

  afterEach(cleanup);

  it("is a region named by its h1, with the actions and the machine", () => {
    draw(<HeroMachine {...PROPS} />);
    expect(screen.getByRole("region", { name: PROPS.title })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PROPS.title);
    expect(screen.getByText(PROPS.lede)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read the docs" }).getAttribute("href")).toBe("/docs");
    expect(screen.getByRole("button", { name: "Copy llms.txt" })).toBeTruthy();
    expect(screen.getByText("stackra create my-app")).toBeTruthy();
  });

  it("draws the machine: the action's window piped into a frame per surface, each with its button", () => {
    const { container } = draw(<HeroMachine {...PROPS} />, { motion: "reduced" });
    const machine = screen.getByRole("group", { name: "One action, every surface" });
    const frames = [...machine.querySelectorAll('[data-slot="frame"]')];
    expect(frames.map((each) => each.getAttribute("data-variant"))).toEqual([
      "schematic",
      "window",
      "window",
      "phone",
    ]);
    expect(frames[0]?.textContent).toContain("export class CancelOrderAction {}");
    expect(frames[1]?.textContent).toContain("orders.example");
    // Each surface is an illustration named by its own words; its drawn button is never a control.
    expect(
      within(machine)
        .getAllByRole("img")
        .map((image) => image.getAttribute("aria-label")),
    ).toEqual(["orders.example, Cancel order", "Orders, Cancel order", "Phone, إلغاء الطلب"]);
    // The only control in the machine is the code's own copy button; no surface button is reachable.
    expect(
      within(machine).queryAllByRole("button", { name: /Cancel order|إلغاء الطلب/ }),
    ).toHaveLength(0);
    const drawn = [...machine.querySelectorAll('[data-slot="surface"] button')];
    expect(drawn).toHaveLength(3);
    for (const button of drawn) expect(button.closest("[inert]")).not.toBeNull();
    const arabic = drawn[2]?.closest("[lang]");
    expect(arabic?.getAttribute("dir")).toBe("rtl");
    // Below the full motion level the pipes are drawn at once, one from the action to each surface.
    expect(machine.getAttribute("data-drawn")).toBe("");
    expect(container.querySelectorAll('[data-slot="schematic-pipes"] path')).toHaveLength(3);
    expect(
      container.querySelector('[data-slot="schematic-pipes"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("draws the pipe in on floor steps at the full motion level, its one orchestrated moment", () => {
    vi.useFakeTimers();
    try {
      draw(<HeroMachine {...PROPS} />);
      const machine = screen.getByRole("group", { name: "One action, every surface" });
      expect(machine.hasAttribute("data-drawn")).toBe(false);
      // Three segments a pipe, all three pipes leave the action together; one act a step, so each schedules the next.
      for (let step = 0; step < 3; step++) act(() => vi.advanceTimersByTime(STEP_MS));
      expect(machine.getAttribute("data-drawn")).toBe("");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reaches the primary link before the copy buttons from the keyboard", () => {
    draw(<HeroMachine {...PROPS} />);
    const link = screen.getByRole("link", { name: "Read the docs" });
    const copy = screen.getByRole("button", { name: "Copy llms.txt" });
    link.focus();
    expect(document.activeElement).toBe(link);
    expect(link.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the engine drawing decorative unless it has alt", () => {
    const { container, rerender } = draw(<HeroMachine {...PROPS} />);
    const drawing = () => container.querySelector<HTMLElement>('[data-slot="hero-art"]');
    expect(within(drawing() ?? container).queryAllByRole("img")).toHaveLength(0);
    rerender(
      <DesignSystemProvider hasShortcutCheatSheet={false}>
        <HeroMachine {...PROPS} art={{ ...PROPS.art, alt: "An engine on the S" }} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole("img", { name: "An engine on the S" })).toBeTruthy();
  });

  it("keeps the band unclipped, so its two marks show whole, with the bands' inline padding on its text", () => {
    const { container } = draw(<HeroMachine {...PROPS} />);
    const band = container.querySelector('[data-slot="blueprint-section"]');
    expect(band?.className).not.toContain("overflow-hidden");
    expect(band?.querySelectorAll('[data-slot="blueprint-mark"]')).toHaveLength(2);
    const grid = container.querySelector('[data-slot="hero-machine"]')?.parentElement;
    expect(grid?.className).toContain("px-4 sm:px-8 lg:px-12");
  });

  it("lays the hero out with logical sides in Arabic and never mirrors the drawing", () => {
    const { container } = draw(<HeroMachine {...PROPS} />, { locale: "ar" });
    expect(document.documentElement.dir).toBe("rtl");
    const drawing = container.querySelector('[data-slot="hero-art"]');
    expect(drawing).toBeTruthy();
    expect(drawing?.outerHTML).not.toContain("scale-x");
    expect(container.querySelector('[data-slot="hero-horizon"]')?.className).toContain(
      "justify-end",
    );
  });

  it("draws the horizon in the tile line under the top mask, as hidden decoration", () => {
    const { container } = draw(<HeroMachine {...PROPS} />);
    const art = container.querySelector('[data-slot="dither-art"]');
    expect(art?.getAttribute("aria-hidden")).toBe("true");
    expect(art?.querySelector("img")?.getAttribute("src")).toBe("/strata-dark.png");
  });

  it("drifts the horizon at the full motion level and stands still below it", () => {
    draw(<HeroMachine {...PROPS} />);
    expect(frame).toHaveBeenCalled();
    cleanup();
    frame.mockClear();
    draw(<HeroMachine {...PROPS} />, { motion: "reduced" });
    expect(frame).not.toHaveBeenCalled();
  });
});
