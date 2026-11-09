/**
 * Stackra file contract:
 * Purpose: proves the web BentoCard is an article named by its heading at the chosen level, draws at most two pill
 *          links that Tab reaches in order, spans two columns on request, draws its media and its hidden art, wears a
 *          brand's variables on its own element only, and reads the same in right-to-left.
 * Boundary: jsdom with real HeroUI; `useReducedMotion` is stubbed so the art stands still; the canvas has no context
 *           in jsdom, so the art keeps its poster.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-2041.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { STACKRA_THEME } from "@stackra/tokens";
import { I18nProvider } from "react-aria-components";

import { BentoCard } from "#react/bento-card/bento-card";

vi.mock("motion/react", () => ({ useReducedMotion: () => true }));

const ACTIONS = [
  { id: "docs", label: "Read the docs", href: "/docs", variant: "primary" as const },
  { id: "code", label: "Read the code", href: "/code" },
  { id: "more", label: "Never drawn", href: "/more" },
];

describe("BentoCard (web)", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: () => null,
      configurable: true,
    });
  });

  it("is an article named by its heading, with two links in Tab order", () => {
    render(
      <BentoCard
        title="Decorators, not frameworks."
        headingLevel={2}
        description="Modules and actions are plain classes."
        actions={ACTIONS}
        media={<pre>@Module()</pre>}
        span={2}
      />,
    );
    const card = screen.getByRole("article", { name: "Decorators, not frameworks." });
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Decorators, not frameworks.",
    );
    expect(card.getAttribute("data-span")).toBe("2");
    expect(card.className).toContain("md:col-span-2");
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByText("Never drawn")).toBeNull();
    expect(screen.getByText("@Module()")).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.tabIndex])).toEqual([
      ["Read the docs", 0],
      ["Read the code", 0],
    ]);
  });

  it("draws its art hidden and wears a brand on its own element", () => {
    const { container } = render(
      <BentoCard title="Pay" brand={STACKRA_THEME} art={{ poster: "/p.png", pattern: "core" }} />,
    );
    const card = screen.getByRole("article", { name: "Pay" });
    expect(card.getAttribute("data-brand")).toBe(STACKRA_THEME.name);
    expect(card.getAttribute("style")).toContain("--");
    expect(document.documentElement.getAttribute("style")).toBeNull();
    expect(container.querySelector('[data-slot="dither-art"]')?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("reads the same in right-to-left", () => {
    render(
      <I18nProvider locale="ar">
        <BentoCard
          title="قرارات في العلن."
          actions={[{ id: "a", label: "القرارات", href: "/adr" }]}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole("article", { name: "قرارات في العلن." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "القرارات" })).toBeTruthy();
  });
});
