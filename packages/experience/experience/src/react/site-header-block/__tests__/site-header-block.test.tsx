/**
 * Stackra file contract:
 * Purpose: proves the SiteHeaderBlock is the banner landmark on AppHeader's transparent variant, with a named `nav` of
 *          the section links, the docs search, the ask-AI and code host links and the app's switchers, every link a
 *          real anchor reachable in order from the keyboard; that it keeps its order in Arabic; and that it draws
 *          everything at once at every motion level.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is a stand-in, and the locale and the
 *           motion level come from `DesignSystemProvider`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { SiteHeaderBlock } from "#react/site-header-block/site-header-block";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const HEADER = (
  <SiteHeaderBlock
    brand={<a href="/">Stackra</a>}
    links={[
      { label: "Docs", href: "/docs" },
      { label: "Blocks", href: "/blocks" },
    ]}
    navLabel="Site"
    docsSearch={{ label: "Search docs", href: "/docs/search" }}
    askAi={{ label: "Ask AI", href: "/docs/ask" }}
    githubHref="https://github.com/figentra/stackra"
    localeSwitcher={<button type="button">العربية</button>}
    themeToggle={<button type="button">Theme</button>}
  />
);

/** The names of the header's links and buttons, in document order. */
const stops = () =>
  [...screen.getByRole("banner").querySelectorAll<HTMLElement>("a[href], button")].map(
    (element) => element.textContent,
  );

describe("SiteHeaderBlock", () => {
  afterEach(cleanup);

  it("is the banner on the transparent variant, with a named nav of the section links", () => {
    render(HEADER);
    const banner = screen.getByRole("banner");
    expect(banner.getAttribute("data-variant")).toBe("transparent");
    const nav = within(banner).getByRole("navigation", { name: "Site" });
    expect(within(nav).getByRole("link", { name: "Docs" }).getAttribute("href")).toBe("/docs");
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
  });

  it("links the docs search, ask AI and the code host, with GitHub as the default words", () => {
    render(HEADER);
    expect(screen.getByRole("link", { name: "Search docs" }).getAttribute("href")).toBe(
      "/docs/search",
    );
    expect(screen.getByRole("link", { name: "Ask AI" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "GitHub" }).getAttribute("href")).toBe(
      "https://github.com/figentra/stackra",
    );
  });

  it("reaches every stop from the keyboard in order: brand, sections, search, links, switchers", () => {
    render(HEADER);
    expect(stops()).toEqual([
      "Stackra",
      "Docs",
      "Blocks",
      "Search docs",
      "Ask AI",
      "GitHub",
      "العربية",
      "Theme",
    ]);
    const search = screen.getByRole("link", { name: "Search docs" });
    search.focus();
    expect(document.activeElement).toBe(search);
  });

  it("keeps the same order in Arabic, where the bar mirrors through its layout", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        {HEADER}
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(stops()[0]).toBe("Stackra");
  });

  it("draws everything at once below the full motion level", () => {
    render(
      <DesignSystemProvider motion="none" hasShortcutCheatSheet={false}>
        {HEADER}
      </DesignSystemProvider>,
    );
    expect(stops()).toHaveLength(8);
  });
});
