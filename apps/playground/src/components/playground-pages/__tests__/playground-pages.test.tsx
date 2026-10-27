/**
 * Stackra file contract:
 * Purpose: proves page discovery pairs each categorised route with its page by folder, orders the pages by category,
 *          then title, skips the index route, refuses a wrong path, an unknown category and a missing page, and
 *          that the real route folders yield every category the existing pages use.
 * Boundary: plain module records for the rules; the real `import.meta.glob` result for the last case; jsdom, no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-056 sta-422:FR-003 sta-422:P-002
// The real route folders load every page, and some read matchMedia or ResizeObserver, which jsdom lacks.
import "#src/__tests__/stub-browser-apis";

import { Route } from "@stackra/navigation";

import { discoverPages, PLAYGROUND_PAGES } from "#src/components/playground-pages";

/** The real catalogue's link to `path`. */
const linkAt = (path: string) =>
  PLAYGROUND_PAGES.find(({ route: link }) => link.path === path)?.route;

/** A route module: a class that extends `Route({ path })` and carries the title and category statics. */
const route = (path: string, title: string, category?: string) => ({
  Page: class extends Route({ path }) {
    static readonly title = title;

    static readonly category = category;
  },
});

/** A page module whose component renders nothing. */
const page = () => ({ Page: () => null });

describe("discoverPages", () => {
  it("pairs a route with its page by folder and orders by category, then title", () => {
    const pages = discoverPages(
      {
        "../../routes/zeta/zeta.route.ts": route("/zeta", "Zeta", "Actions"),
        "../../routes/alpha/alpha.route.ts": route("/alpha", "Alpha", "Actions"),
        "../../routes/field/field.route.ts": route("/field", "Field", "Inputs and forms"),
        "../../routes/base/base.route.ts": route("/base", "Base", "Foundations"),
      },
      {
        "../../routes/zeta/zeta.tsx": page(),
        "../../routes/alpha/alpha.tsx": page(),
        "../../routes/field/field.tsx": page(),
        "../../routes/base/base.tsx": page(),
      },
    );
    expect(pages.map(({ route: { title } }) => title)).toEqual(["Base", "Alpha", "Zeta", "Field"]);
    expect(pages[0]?.route).toEqual({
      path: "/base",
      title: "Base",
      category: "Foundations",
    });
    expect(pages[0]?.element.type).toBeTypeOf("function");
  });

  it("skips a route that names no category, as the index route does", () => {
    expect(discoverPages({ "../../routes/home/home.route.ts": route("/", "Home") }, {})).toEqual(
      [],
    );
  });

  it("refuses a path that is not the folder name", () => {
    expect(() =>
      discoverPages(
        { "../../routes/a/a.route.ts": route("/b", "A", "Actions") },
        { "../../routes/a/a.tsx": page() },
      ),
    ).toThrow('the path must be "/a"');
  });

  it("refuses an unknown category", () => {
    expect(() =>
      discoverPages(
        { "../../routes/a/a.route.ts": route("/a", "A", "Gadgets") },
        { "../../routes/a/a.tsx": page() },
      ),
    ).toThrow('"Gadgets" is not a page category');
  });

  it("refuses a route whose page is missing", () => {
    expect(() =>
      discoverPages({ "../../routes/a/a.route.ts": route("/a", "A", "Actions") }, {}),
    ).toThrow("no page component in a.tsx");
  });

  it("ignores files that do not repeat the folder name", () => {
    expect(
      discoverPages({ "../../routes/a/other.route.ts": route("/a", "A", "Actions") }, {}),
    ).toEqual([]);
  });
});

describe("PLAYGROUND_PAGES", () => {
  it("finds the real route folders, each under its own path, in category order", () => {
    const paths = PLAYGROUND_PAGES.map(({ route: { path } }) => path);
    expect(paths).toContain("/button");
    expect(paths).toContain("/foundations");
    expect(paths).not.toContain("/");
    expect(PLAYGROUND_PAGES.find(({ route: { path } }) => path === "/button")?.route.category).toBe(
      "Actions",
    );
    expect(PLAYGROUND_PAGES[0]?.route.category).toBe("Foundations");
    expect(PLAYGROUND_PAGES.at(-1)?.route.category).toBe("AI");
  });

  it("lists no `@stackra-pro/ui` page: the public playground shows free components only", () => {
    expect(PLAYGROUND_PAGES.filter(({ route: link }) => link.path.startsWith("/pro-"))).toEqual([]);
  });

  it("leaves ownsMain out for a page that does not draw its own main", () => {
    expect(linkAt("/button")).not.toHaveProperty("ownsMain");
  });
});
