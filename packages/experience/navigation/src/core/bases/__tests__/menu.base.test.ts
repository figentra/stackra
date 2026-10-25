/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Menu` kind base: the kind is recorded, an unknown kind is refused, `items(m)` is
 *          written without `override`, and constructor injection reaches it.
 * Boundary: test only; the classes restate the template's web and mobile menus.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 14, 16 and 25).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "vitest";

import { Menu } from "#core/bases/menu.base";
import { MenuKind } from "#core/enums/menu-kind.enum";
import { createMenuBuilder } from "#core/functions/create-menu-builder.function";
import { routeRef } from "#core/functions/route-ref.function";
import type { MenuBuilder } from "#core/types/menu-builder.type";
import type { MenuClass } from "#core/types/menu-class.type";

const Routes = { landing: routeRef("landing"), contact: routeRef("contact") };

/** A stand-in for the site config. */
class SiteConfig {
  readonly docsUrl = "https://docs.acme.test";
}

class SiteMenu extends Menu({ kind: MenuKind.Navigation }) {
  private readonly site: SiteConfig;

  constructor(site: SiteConfig) {
    super();
    this.site = site;
  }

  items(m: MenuBuilder) {
    return [
      m.route(Routes.landing, { label: "web::nav.home", end: true }),
      m.link("web::nav.docs", this.site.docsUrl, { external: true }),
    ];
  }
}

describe("Menu", () => {
  it("records its kind", () => {
    expect(kindOf(SiteMenu)).toEqual({ kind: "menu", options: { kind: "navigation" } });
  });

  it("refuses an unknown kind", () => {
    expect(() => Menu({ kind: "sidebar" as MenuKind })).toThrow(/not a menu kind/);
  });

  it("builds its items with its dependencies", () => {
    expect(new SiteMenu(new SiteConfig()).items(createMenuBuilder())).toEqual([
      { kind: "route", to: Routes.landing, label: "web::nav.home", end: true },
      { kind: "link", label: "web::nav.docs", url: "https://docs.acme.test", external: true },
    ]);
  });

  it("keeps instanceof and returns a MenuClass", () => {
    expect(new SiteMenu(new SiteConfig())).toBeInstanceOf(Menu);
    expectTypeOf(Menu).returns.toEqualTypeOf<MenuClass>();
  });
});
