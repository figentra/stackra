/**
 * Stackra file contract:
 * Purpose: proves the web Footer is the page's contentinfo landmark with its columns in a navigation landmark named
 *          "Footer", each list named by its heading, and a bottom row with the copyright, legal links and the locale
 *          slot; an external link is marked.
 * Boundary: jsdom with real HeroUI links.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); WCAG 2.2 SC 1.3.1; STA-1371 (wave D).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Footer } from "#react/footer/footer";

describe("Footer (web)", () => {
  it("draws the landmarks, columns and bottom row", () => {
    render(
      <Footer
        brand={<strong>Dukkan</strong>}
        groups={[
          {
            title: "Help",
            links: [
              { label: "Shipping", href: "/help/shipping" },
              { label: "Returns", href: "/help/returns" },
            ],
          },
          {
            title: "Follow us",
            links: [{ label: "Instagram", href: "https://instagram.com/dukkan", isExternal: true }],
          },
        ]}
        copyright="© 2026 Dukkan"
        legalLinks={[{ label: "Privacy", href: "/privacy" }]}
        localeSwitcher={<button type="button">العربية</button>}
      />,
    );
    expect(screen.getByRole("contentinfo")).toBeTruthy();
    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(nav.querySelectorAll("h2")).toHaveLength(2);
    expect(screen.getByRole("list", { name: "Help" }).querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Instagram/ }).getAttribute("target")).toBe("_blank");
    expect(screen.getByText("© 2026 Dukkan")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("button", { name: "العربية" })).toBeTruthy();
  });

  it("leaves out what is not given", () => {
    render(<Footer copyright="© 2026 Dukkan" />);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByText("© 2026 Dukkan")).toBeTruthy();
  });
});
