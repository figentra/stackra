// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `hydrateRoute`: the route renders inside its layout's outlet under the named contexts, with
 *          the catalogues of the page's locale (matched case-insensitively), and the route and layout instances from
 *          the container as their matches' `handle`; a locale the configuration does not list rejects.
 * Boundary: test only; jsdom supplies the DOM; `hydrateRoot` renders on a fresh client root, since the test has no
 *           prerendered markup to hydrate.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10); ADR 0297.
 */
import type { Wiring } from "@stackra/container";
import { I18nConfig, Locale } from "@stackra/i18n";
import type { I18nKey } from "@stackra/i18n";
import { useLocale, useTranslation } from "@stackra/i18n/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import type { RootOptions } from "react-dom/client";
import { Outlet, useMatches } from "react-router";

import { hydrateRoute } from "#browser/functions/hydrate-route.function";
import type { AppSections } from "#core/types/app-sections.type";

vi.mock("react-dom/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom/client")>();
  return {
    ...actual,
    hydrateRoot: vi.fn((root: Element, tree: ReactNode, options?: RootOptions) => {
      const created = actual.createRoot(root, options);
      created.render(tree);
      return created;
    }),
  };
});

class SiteI18nConfig extends I18nConfig {
  override locales: Locale[] = [Locale.En, Locale.Ar];
}

class PublicLayout {
  readonly frame = "public";
}

class OfflineRoute {
  readonly path = "/offline";
}

/** The frame: a header, then the outlet. */
function Public() {
  return (
    <main>
      <header>frame</header>
      <Outlet />
    </main>
  );
}

/** The page: the locale, one translation and whether both handles are the bound instances. */
function Offline() {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const handles = useMatches().map((match) => match.handle);
  const bound = handles[0] instanceof PublicLayout && handles[1] instanceof OfflineRoute;
  return <p>{`${locale}|${t("web::offline.title" as I18nKey)}|${String(bound)}`}</p>;
}

const load = vi.fn((locale: Locale) =>
  Promise.resolve({ web: { offline: { title: locale === Locale.Ar ? "غير متصل" : "Offline" } } }),
);

const wiring: Wiring & AppSections = {
  member: "@acme/console",
  root: "console",
  modules: { console: { exports: [], dependsOn: [] } },
  bindings: [
    { module: "console", kind: "layout", provide: PublicLayout },
    { module: "console", kind: "route", provide: OfflineRoute },
  ],
  config: [{ key: "i18n", provide: I18nConfig, override: SiteI18nConfig }],
  contexts: ["i18n"],
  messages: load,
};

/** Hydrates a fresh root with `locale` and returns it. */
async function hydrate(locale: string, contexts?: readonly string[]): Promise<HTMLElement> {
  const root = document.createElement("div");
  document.body.append(root);
  await act(async () => {
    await hydrateRoute(root, {
      wiring,
      layout: { class: PublicLayout, component: Public },
      route: { class: OfflineRoute, component: Offline },
      locale,
      ...(contexts === undefined ? {} : { contexts }),
    });
  });
  return root;
}

describe("hydrateRoute", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    load.mockClear();
  });

  it("renders the route inside its layout with the locale's catalogues and bound handles", async () => {
    const root = await hydrate("ar");
    expect(root.querySelector("header")?.textContent).toBe("frame");
    expect(root.querySelector("p")?.textContent).toBe("ar|غير متصل|true");
    expect(load).toHaveBeenCalledWith(Locale.Ar);
  });

  it("matches the page's locale case-insensitively", async () => {
    const root = await hydrate("EN");
    expect(root.querySelector("p")?.textContent).toBe("en|Offline|true");
  });

  it("mounts only the named contexts", async () => {
    const root = await hydrate("en", ["i18n"]);
    expect(root.querySelector("p")?.textContent).toBe("en|Offline|true");
  });

  it("rejects a locale the configuration does not list", async () => {
    await expect(
      hydrateRoute(document.createElement("div"), {
        wiring,
        layout: { class: PublicLayout, component: Public },
        route: { class: OfflineRoute, component: Offline },
        locale: "fr",
      }),
    ).rejects.toThrow(/"fr"/);
  });
});
