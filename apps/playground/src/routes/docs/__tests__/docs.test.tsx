/**
 * Stackra file contract:
 * Purpose: proves the Docs home sits at `/docs`, titles the document, draws its h1, the three getting-started steps
 *          with their code, a card per built web foundations page and the guides, every link keeping the search params.
 * Boundary: a memory router in jsdom; no network. Rendered alone, outside the shell.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement); STA-1371 (Docs home).
 */
import "#src/__tests__/stub-browser-apis";

import { byCategory } from "@stackra/showcase";
import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { routePath } from "#src/components/playground-pages/route-path.function";
import { Docs } from "#src/routes/docs/docs";
import { DocsRoute } from "#src/routes/docs/docs.route";

function renderDocs(url = "/docs") {
  const router = createMemoryRouter([{ path: routePath(DocsRoute), element: <Docs /> }], {
    initialEntries: [url],
  });
  render(<RouterProvider router={router} />);
}

describe("DocsRoute", () => {
  it("renders the Docs home at /docs and lights the Docs tab", () => {
    expect(routePath(DocsRoute)).toBe("/docs");
    expect(DocsRoute.handle.section).toBe("docs");
    renderDocs();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Docs");
    expect(document.title).toBe("Docs · Stackra Design System");
  });

  it("shows the three steps with their code", () => {
    renderDocs();
    const region = screen.getByRole("region", { name: "Get started" });
    expect(within(region).getAllByRole("listitem")).toHaveLength(3);
    // The snippet highlights its tokens, so the command reads across several elements.
    expect(region.textContent).toContain("pnpm add @stackra/ui");
    expect(region.textContent).toContain("DesignSystemProvider");
  });

  it("links each built web foundations page and the guides, keeping the search params", () => {
    renderDocs("/docs?scheme=dark&locale=ar");
    const foundations = within(screen.getByRole("region", { name: "Foundations" }));
    const built = byCategory("foundations").filter(
      (entry) => entry.status !== "planned" && entry.platforms.includes("react"),
    );
    expect(foundations.getAllByRole("link")).toHaveLength(built.length);
    const guides = within(screen.getByRole("region", { name: "Guides" }));
    expect(guides.getByRole("link", { name: /Choose an overlay/ }).getAttribute("href")).toBe(
      "/alert-dialog?scheme=dark&locale=ar#guidance",
    );
    expect(guides.getByRole("link", { name: /Make a theme/ }).getAttribute("href")).toBe(
      "/theme-studio?scheme=dark&locale=ar",
    );
  });
});
