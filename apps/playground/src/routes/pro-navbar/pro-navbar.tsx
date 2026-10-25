/**
 * Stackra file contract:
 * Purpose: the page of the Navbar route: `@stackra-pro/ui`'s Navbar as a static bar inside the page, with a brand, four
 *          links that mark the current page, a menu toggle and panel that stand in for the links on a narrow
 *          viewport, and a line that says which page is current.
 * Boundary: presentation and local state only. The bar is `static` and does not block scroll, so it stays in the page
 *          instead of fixing itself to the viewport; a link press is held back so the page does not navigate.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProNavbarRoute } from "#src/routes/pro-navbar/pro-navbar.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-navbar.*` keys.
const STRINGS = {
  documentTitle: `${ProNavbarRoute.title} · Stackra Playground`,
  intro:
    "A top navigation bar. Choose a link to move the current page; on a narrow viewport the links collapse behind the menu button.",
  bar: "Site navigation",
  toggle: "Open or close the menu",
  brand: "Stackra",
  current: (label: string) => `Current page: ${label}`,
  section: "Site bar",
} as const;

const LINKS = [
  { id: "overview", label: "Overview" },
  { id: "customers", label: "Customers" },
  { id: "pricing", label: "Pricing" },
  { id: "docs", label: "Docs" },
] as const;

/** The Navbar page. */
export function ProNavbar() {
  const [current, setCurrent] = useState<string>(LINKS[0].id);
  const label = LINKS.find((link) => link.id === current)?.label ?? "";

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProNavbarRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="navbar-heading" className="grid gap-3">
        <h2 id="navbar-heading" className="type-h2">
          {STRINGS.section}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <UiPro.Navbar label={STRINGS.bar} position="static" shouldBlockScroll={false}>
            <UiPro.Navbar.Header>
              <UiPro.Navbar.MenuToggle label={STRINGS.toggle} className="md:hidden" />
              <UiPro.Navbar.Brand>
                <span className="font-semibold">{STRINGS.brand}</span>
              </UiPro.Navbar.Brand>
              <UiPro.Navbar.Spacer />
              <UiPro.Navbar.Content className="hidden md:flex">
                {LINKS.map((link) => (
                  <UiPro.Navbar.Item
                    key={link.id}
                    href={`#${link.id}`}
                    isCurrent={link.id === current}
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrent(link.id);
                    }}
                  >
                    {link.label}
                  </UiPro.Navbar.Item>
                ))}
              </UiPro.Navbar.Content>
            </UiPro.Navbar.Header>
            <UiPro.Navbar.Menu>
              {LINKS.map((link) => (
                <UiPro.Navbar.MenuItem
                  key={link.id}
                  href={`#${link.id}`}
                  isCurrent={link.id === current}
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrent(link.id);
                  }}
                >
                  {link.label}
                </UiPro.Navbar.MenuItem>
              ))}
            </UiPro.Navbar.Menu>
          </UiPro.Navbar>
        </div>
        <p role="status">
          <bdi>{STRINGS.current(label)}</bdi>
        </p>
      </section>
    </article>
  );
}
