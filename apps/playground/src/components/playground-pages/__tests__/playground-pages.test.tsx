/**
 * Stackra file contract:
 * Purpose: proves page discovery pairs each route whose path names a registry entry with its page by folder (a loaded
 *          module or a lazy loader, called only when the page renders), orders
 *          the pages as the registry does (category, then tier, then slug), skips a route with no entry
 *          (the index), refuses a wrong path and a missing page, and that the real route folders each map to an
 *          entry.
 * Boundary: plain module records and a small registry for the rules; the real `import.meta.glob` result for the
 *           last cases; jsdom, no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-056 sta-422:FR-003 sta-422:P-002
// Some real route pages read matchMedia as their modules load.
import "#src/__tests__/stub-browser-apis";

import { Route } from "@stackra/navigation";
import { bySlug, type ComponentEntry } from "@stackra/showcase";
import { render, screen } from "@testing-library/react";
import { Suspense } from "react";

import { discoverPages, PLAYGROUND_PAGES } from "#src/components/playground-pages";

/** The real catalogue's link to `path`. */
const linkAt = (path: string) =>
  PLAYGROUND_PAGES.find(({ route: link }) => link.path === path)?.route;

/** A route module: a class that extends `Route({ path })`. */
const route = (path: string, ownsMain?: boolean) => ({
  Page: class extends Route({ path }) {
    static readonly ownsMain = ownsMain;
  },
});

/** A page module whose component renders nothing. */
const page = () => ({ Page: () => null });

/** A small registry entry. */
const entry = (
  slug: string,
  tier: ComponentEntry["tier"],
  category: ComponentEntry["category"],
): ComponentEntry => ({
  slug,
  tier,
  category,
  platforms: ["react"],
  packageName: "@stackra/ui",
  exportName: slug,
  parts: [slug],
  hero: {},
  examples: [{ id: "usage", card: true }],
  related: [],
  tokens: [],
  keywords: [],
});

const REGISTRY = [
  entry("zeta", "free", "actions"),
  entry("alpha", "free", "actions"),
  entry("field", "free", "inputs_and_forms"),
  entry("aaa", "free", "actions"),
  entry("base", "free", "foundations"),
];

describe("discoverPages", () => {
  it("pairs a route with its page by folder and orders by category, then slug", () => {
    const pages = discoverPages(
      {
        "../../routes/zeta/zeta.route.ts": route("/zeta"),
        "../../routes/alpha/alpha.route.ts": route("/alpha"),
        "../../routes/field/field.route.ts": route("/field"),
        "../../routes/aaa/aaa.route.ts": route("/aaa", true),
        "../../routes/base/base.route.ts": route("/base"),
      },
      {
        "../../routes/zeta/zeta.tsx": page(),
        "../../routes/alpha/alpha.tsx": page(),
        "../../routes/field/field.tsx": page(),
        "../../routes/aaa/aaa.tsx": page(),
        "../../routes/base/base.tsx": page(),
      },
      REGISTRY,
    );
    expect(pages.map(({ route: { path } }) => path)).toEqual([
      "/base",
      "/aaa",
      "/alpha",
      "/zeta",
      "/field",
    ]);
    expect(pages[0]?.route.entry.slug).toBe("base");
    expect(pages[1]?.route).toMatchObject({ path: "/aaa", ownsMain: true });
    expect(pages[0]?.route).not.toHaveProperty("ownsMain");
    expect(pages[0]?.element.type).toBeTypeOf("function");
  });

  it("takes a lazy page loader and renders its component once loaded", async () => {
    const load = vi.fn(async () => ({ Page: () => <p>alpha page</p> }));
    const [found] = discoverPages(
      { "../../routes/alpha/alpha.route.ts": route("/alpha") },
      { "../../routes/alpha/alpha.tsx": load },
      REGISTRY,
    );
    expect(load).not.toHaveBeenCalled();
    render(<Suspense fallback={null}>{found?.element}</Suspense>);
    expect(await screen.findByText("alpha page")).toBeTruthy();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("skips a route whose path names no entry, as the index route does", () => {
    expect(discoverPages({ "../../routes/home/home.route.ts": route("/") }, {}, REGISTRY)).toEqual(
      [],
    );
  });

  it("refuses a path that is not the folder name", () => {
    expect(() =>
      discoverPages(
        { "../../routes/a/a.route.ts": route("/alpha") },
        { "../../routes/a/a.tsx": page() },
        REGISTRY,
      ),
    ).toThrow('the path must be "/a"');
  });

  it("refuses a route whose page is missing", () => {
    expect(() =>
      discoverPages({ "../../routes/alpha/alpha.route.ts": route("/alpha") }, {}, REGISTRY),
    ).toThrow("no page component in alpha.tsx");
  });

  it("ignores files that do not repeat the folder name", () => {
    expect(
      discoverPages({ "../../routes/alpha/other.route.ts": route("/alpha") }, {}, REGISTRY),
    ).toEqual([]);
  });
});

describe("PLAYGROUND_PAGES", () => {
  it("finds the real route folders, each under its own path, in registry order", () => {
    const paths = PLAYGROUND_PAGES.map(({ route: { path } }) => path);
    expect(paths).toContain("/button");
    expect(paths).toContain("/foundations");
    expect(paths).not.toContain("/");
    expect(paths).not.toContain("/components");
    expect(linkAt("/button")?.entry).toBe(bySlug("free", "button"));
    expect(PLAYGROUND_PAGES[0]?.route.entry.category).toBe("foundations");
    expect(PLAYGROUND_PAGES.at(-1)?.route.entry.category).toBe("ai");
  });

  it("leaves ownsMain out for a page that does not draw its own main", () => {
    expect(linkAt("/button")).not.toHaveProperty("ownsMain");
  });
});
