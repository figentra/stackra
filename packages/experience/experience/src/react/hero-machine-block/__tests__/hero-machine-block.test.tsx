/**
 * Stackra file contract:
 * Purpose: proves the HeroMachineBlock is a blueprint region named by its `h1`, with the primary link, the copy link
 *          and the command reachable in order from the keyboard, the machine at the inline end, the engine drawing
 *          decorative unless it has `alt` and never mirrored in Arabic, and the dither horizon that drifts at the
 *          `full` motion level and stands still below it.
 * Boundary: unit tier, jsdom, the real @stackra/ui components. The locale and the motion level come from
 *           `DesignSystemProvider` (this package cannot reach react-aria-components or Motion directly); jsdom has no
 *           matchMedia, canvas or animation frames, so those are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { HeroMachineBlock } from "#react/hero-machine-block/hero-machine-block";
import type { HeroMachineBlockProps } from "#react/hero-machine-block/hero-machine-block.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const frame = vi.fn(() => 1);

const PROPS: HeroMachineBlockProps = {
  title: "One backend, every surface.",
  lede: "Write an action once.",
  primary: { label: "Read the docs", href: "/docs" },
  copyLink: { label: "Copy llms.txt", value: "https://stackra.dev/llms.txt" },
  command: "stackra create my-app",
  art: { src: "/landing/art/engine.svg" },
  horizon: { poster: "/strata-dark.png", sun: { x: 0.8, y: 1 } },
  machine: <p>cancel-order.action.ts</p>,
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

describe("HeroMachineBlock", () => {
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
    draw(<HeroMachineBlock {...PROPS} />);
    expect(screen.getByRole("region", { name: PROPS.title })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(PROPS.title);
    expect(screen.getByText(PROPS.lede)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Read the docs" }).getAttribute("href")).toBe("/docs");
    expect(screen.getByRole("button", { name: "Copy llms.txt" })).toBeTruthy();
    expect(screen.getByText("stackra create my-app")).toBeTruthy();
    expect(screen.getByText("cancel-order.action.ts")).toBeTruthy();
  });

  it("reaches the primary link before the copy buttons from the keyboard", () => {
    draw(<HeroMachineBlock {...PROPS} />);
    const link = screen.getByRole("link", { name: "Read the docs" });
    const copy = screen.getByRole("button", { name: "Copy llms.txt" });
    link.focus();
    expect(document.activeElement).toBe(link);
    expect(link.compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the engine drawing decorative unless it has alt", () => {
    const { rerender } = draw(<HeroMachineBlock {...PROPS} />);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    rerender(
      <DesignSystemProvider hasShortcutCheatSheet={false}>
        <HeroMachineBlock {...PROPS} art={{ src: PROPS.art.src, alt: "An engine on the S" }} />
      </DesignSystemProvider>,
    );
    expect(screen.getByRole("img", { name: "An engine on the S" })).toBeTruthy();
  });

  it("lays the hero out with logical sides in Arabic and never mirrors the drawing", () => {
    const { container } = draw(<HeroMachineBlock {...PROPS} />, { locale: "ar" });
    expect(document.documentElement.dir).toBe("rtl");
    const drawing = container.querySelector('img[src="/landing/art/engine.svg"]');
    expect(drawing?.className).not.toContain("scale-x");
    expect(container.querySelector('[data-slot="hero-horizon"]')?.className).toContain(
      "justify-end",
    );
  });

  it("draws the horizon in the tile line under the top mask, as hidden decoration", () => {
    const { container } = draw(<HeroMachineBlock {...PROPS} />);
    const art = container.querySelector('[data-slot="dither-art"]');
    expect(art?.getAttribute("aria-hidden")).toBe("true");
    expect(art?.querySelector("img")?.getAttribute("src")).toBe("/strata-dark.png");
  });

  it("drifts the horizon at the full motion level and stands still below it", () => {
    draw(<HeroMachineBlock {...PROPS} />);
    expect(frame).toHaveBeenCalled();
    cleanup();
    frame.mockClear();
    draw(<HeroMachineBlock {...PROPS} />, { motion: "reduced" });
    expect(frame).not.toHaveBeenCalled();
  });
});
