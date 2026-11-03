/**
 * Stackra file contract:
 * Purpose: proves the BentoGridBlock lays its cards in one or two columns, stacks a two-column grid under `md`, keeps
 *          every card's links in reading and Tab order, and reads the same in right-to-left.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is stubbed for the DesignSystemProvider.
 *           Nothing in the grid moves, so there is no motion to reduce.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { BentoCard, DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { BentoGridBlock } from "#react/bento-grid-block/bento-grid-block";

const cards = (
  <>
    <BentoCard title="Decorators" actions={[{ id: "a", label: "Read", href: "/a" }]} span={2} />
    <BentoCard title="Decisions" actions={[{ id: "b", label: "Browse", href: "/b" }]} />
  </>
);

describe("BentoGridBlock", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
  });
  afterEach(cleanup);

  it("lays two columns that stack under md, with the cards' links in Tab order", () => {
    const { container } = render(<BentoGridBlock className="mt-8">{cards}</BentoGridBlock>);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(2, minmax(0, 1fr))");
    expect(grid.className).toContain("max-md:grid-cols-1!");
    expect(grid.className).toContain("mt-8");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.tabIndex])).toEqual([
      ["Read", 0],
      ["Browse", 0],
    ]);
    links[1]?.focus();
    expect(document.activeElement).toBe(links[1]);
  });

  it("keeps one column without the stacking rule", () => {
    const { container } = render(<BentoGridBlock columns={1}>{cards}</BentoGridBlock>);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe("repeat(1, minmax(0, 1fr))");
    expect(grid.className).not.toContain("grid-cols-1!");
  });

  it("reads the same in right-to-left", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <BentoGridBlock>
          <BentoCard title="قرارات في العلن." />
        </BentoGridBlock>
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("article", { name: "قرارات في العلن." })).toBeTruthy();
  });
});
