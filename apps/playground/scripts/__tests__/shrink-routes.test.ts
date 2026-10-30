/**
 * Stackra file contract:
 * Purpose: proves the shrink-routes codemod strips the title and category statics and the enum import from a route
 *          module, keeps `ownsMain`, derives the tier from a `pro-` folder and writes the one-line page.
 * Boundary: the pure functions only; no files are touched.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (WP5); ADR 0022 (test placement).
 */
import { pageSource } from "../page-source.function";
import { shrinkRouteSource } from "../shrink-route-source.function";
import { tierAndSlug } from "../tier-and-slug.function";

const ROUTE = `/**
 * Purpose: the button route of @figentra/playground: its path, title and category.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The Button page, at \`/button\`. */
export class ButtonRoute extends Route({ path: "/button" }) {
  /** The page title. */
  static readonly title = "Button";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Actions";

  /** The page draws its own main. */
  static readonly ownsMain = true;
}
`;

describe("shrink-routes", () => {
  it("strips the statics and the enum import and keeps ownsMain", () => {
    const out = shrinkRouteSource(ROUTE);
    expect(out).not.toContain("static readonly title");
    expect(out).not.toContain("static readonly category");
    expect(out).not.toContain("page-category.enum");
    expect(out).toContain("static readonly ownsMain = true;");
    expect(out).toContain("its path.");
    expect(out).toContain(
      'extends Route({ path: "/button" }) {\n  /** The page draws its own main. */',
    );
  });

  it("leaves a route with only a path as an empty class", () => {
    const out = shrinkRouteSource(
      ROUTE.replace(/\n\n  \/\*\* The page draws[^}]*ownsMain = true;\n/, "\n"),
    );
    expect(out).toContain('extends Route({ path: "/button" }) {}');
  });

  it("derives the tier from the folder and writes the one-line page", () => {
    expect(tierAndSlug("pro-kanban")).toEqual({ tier: "pro", slug: "kanban" });
    expect(tierAndSlug("button")).toEqual({ tier: "free", slug: "button" });
    expect(pageSource("pro-kanban")).toContain('<ComponentPage tier="pro" slug="kanban" />');
  });
});
