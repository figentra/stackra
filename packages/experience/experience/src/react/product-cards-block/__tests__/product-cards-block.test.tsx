/**
 * Stackra file contract:
 * Purpose: proves the ProductCardsBlock draws one card per product, named by the product, in a group named by its
 *          label: a scrolling strip with a pause button whose second copy stays out of reach, a still wrapped strip
 *          under reduced motion, or a grid whose links Tab reaches in reading order; and that it reads the same in
 *          right-to-left.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is stubbed and its reduced-motion answer is
 *           flipped through its change listeners, as Motion reads it. Each product's theme is BentoCard's own concern,
 *           proven in @stackra/ui.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 2.2.2; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ProductCardsBlock } from "#react/product-cards-block/product-cards-block";

const media = { isReduced: false, listeners: new Set<() => void>() };

/** Answers `prefers-reduced-motion` as `isReduced` and tells every listener. */
const setReduced = (isReduced: boolean) => {
  media.isReduced = isReduced;
  for (const listener of media.listeners) listener();
};

const PRODUCTS = [
  { id: "pay", name: "Pay", descriptor: "Payments", href: "https://pay.example" },
  { id: "commerce", name: "Commerce", descriptor: "Shops" },
];

describe("ProductCardsBlock", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return query.includes("reduced-motion") && media.isReduced;
      },
      addEventListener: (_: string, listener: () => void) => media.listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => media.listeners.delete(listener),
    }));
  });
  afterEach(() => {
    cleanup();
    setReduced(false);
  });

  it("scrolls a named strip with a pause button, each link reached once", () => {
    render(<ProductCardsBlock label="Built on Stackra" products={PRODUCTS} linkLabel="Visit" />);
    expect(screen.getByRole("group", { name: "Built on Stackra" })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("article", { name: "Pay" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Visit" })).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("stands still and wraps under reduced motion", () => {
    setReduced(true);
    render(<ProductCardsBlock label="Built on Stackra" products={PRODUCTS} />);
    expect(screen.getByRole("group", { name: "Built on Stackra" }).className).toContain(
      "flex-wrap",
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: "Pay" })).toBeTruthy();
  });

  it("lays a named grid whose links Tab reaches in reading order", () => {
    render(
      <ProductCardsBlock
        label="Built on Stackra"
        layout="grid"
        products={[...PRODUCTS, { id: "os", name: "OS", descriptor: "Operations", href: "/os" }]}
      />,
    );
    const grid = screen.getByRole("group", { name: "Built on Stackra" });
    expect(grid.style.gridTemplateColumns).toContain("240px");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.tabIndex])).toEqual([
      ["Pay", 0],
      ["OS", 0],
    ]);
  });

  it("reads the same in right-to-left", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <ProductCardsBlock
          label="مبني على ستاكرا"
          layout="grid"
          products={[{ id: "pay", name: "باي", descriptor: "المدفوعات" }]}
        />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("group", { name: "مبني على ستاكرا" })).toBeTruthy();
    expect(screen.getByRole("article", { name: "باي" })).toBeTruthy();
  });
});
