/**
 * Stackra file contract:
 * Purpose: proves the SiteFooter is the page's contentinfo landmark with its columns in a navigation landmark,
 *          each list named by its heading, links Tab reaches in reading order, the legal line and the locale switcher
 *          slot, and that it reads the same in right-to-left.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; matchMedia is stubbed for the DesignSystemProvider.
 *           Nothing in the footer moves, so there is no motion to reduce.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; WCAG 2.2 SC 1.3.1; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "@stackra/testing";
import { DesignSystemProvider } from "@stackra/ui/react";
import { cleanup, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { SiteFooter } from "#react/site-footer/site-footer";

const LEGAL = "Stackra is made by Figentra Technologies L.L.C";

describe("SiteFooter", () => {
  beforeAll(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }));
  });
  afterEach(cleanup);

  it("is the contentinfo landmark with named columns, the legal line and the switcher", () => {
    render(
      <SiteFooter
        groups={[
          {
            title: "Docs",
            links: [
              { label: "Start", href: "/docs" },
              { label: "Decisions", href: "/adr" },
            ],
          },
        ]}
        legal={LEGAL}
        localeSwitcher={<button type="button">العربية</button>}
      />,
    );
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    expect(screen.getByRole("navigation")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Docs" })).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.tabIndex])).toEqual([
      ["Start", 0],
      ["Decisions", 0],
    ]);
    expect(screen.getByText(LEGAL)).toBeTruthy();
    expect(screen.getByRole("button", { name: "العربية" })).toBeTruthy();
  });

  it("reads the same in right-to-left", () => {
    render(
      <DesignSystemProvider locale="ar" hasShortcutCheatSheet={false}>
        <SiteFooter
          groups={[{ title: "التوثيق", links: [{ label: "ابدأ", href: "/ar/docs" }] }]}
          legal="ستاكرا من صنع فيجنترا للتقنية ذ.م.م"
        />
      </DesignSystemProvider>,
    );
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByRole("list", { name: "التوثيق" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "ابدأ" })).toBeTruthy();
  });
});
