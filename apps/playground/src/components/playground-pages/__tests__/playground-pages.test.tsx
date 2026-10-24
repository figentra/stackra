/**
 * Stackra file contract:
 * Purpose: proves page discovery pairs each categorised route with its page by folder, orders the pages by category,
 *          then tier (a `/pro-*` path is Pro, after the free pages) and then title, skips the index route, refuses a wrong path, an unknown category and a missing page, and
 *          that the real route folders yield every category the existing pages use.
 * Boundary: plain module records for the rules; the real `import.meta.glob` result for the last case; jsdom, no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-350:FR-056 sta-422:FR-003 sta-422:P-002
import { discoverPages, PLAYGROUND_PAGES } from "#src/components/playground-pages";

/** A route module with the statics a route class carries. */
const route = (path: string, title: string, category?: string) => ({
  Route: class {
    static readonly path = path;
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
        "../../routes/field/field.route.ts": route("/field", "Field", "Inputs"),
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
      tier: "Free",
    });
    expect(pages[0]?.element.type).toBeTypeOf("function");
  });

  it("marks a `/pro-*` path Pro and lists it after the free pages of its category", () => {
    const pages = discoverPages(
      {
        "../../routes/pro-alpha/pro-alpha.route.ts": route("/pro-alpha", "Alpha Pro", "Actions"),
        "../../routes/zeta/zeta.route.ts": route("/zeta", "Zeta", "Actions"),
      },
      {
        "../../routes/pro-alpha/pro-alpha.tsx": page(),
        "../../routes/zeta/zeta.tsx": page(),
      },
    );
    expect(pages.map(({ route: { title, tier } }) => `${title} ${tier}`)).toEqual([
      "Zeta Free",
      "Alpha Pro Pro",
    ]);
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
  });
});
