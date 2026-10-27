/**
 * Stackra file contract:
 * Purpose: proves the Markdown page sits at /pro-markdown in the Pro category, titles the page and the document, and renders a document with its blocks and a streaming reply cut off part-way.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen, waitFor } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProMarkdown } from "#src/routes/pro-markdown/pro-markdown";
import { ProMarkdownRoute } from "#src/routes/pro-markdown/pro-markdown.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProMarkdown", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-markdown in the Pro category, and titles the page and the document", () => {
    render(<ProMarkdown />);
    expect(routePath(ProMarkdownRoute)).toBe("/pro-markdown");
    expect(ProMarkdownRoute.category).toBe("AI");
    expect(screen.getByRole("heading", { level: 1, name: ProMarkdownRoute.title })).toBeTruthy();
    expect(document.title).toBe("Markdown · Stackra Playground");
  });

  it("renders the document's blocks", () => {
    render(<ProMarkdown />);
    expect(screen.getByRole("heading", { level: 3, name: "Markdown in a reply" })).toBeTruthy();
    expect(screen.getByText("react-markdown").tagName).toBe("STRONG");
    expect(document.querySelector("blockquote")).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["A document", "A reply still streaming"]);
  });

  it("renders the streaming reply", async () => {
    render(<ProMarkdown />);
    await waitFor(() =>
      expect(document.querySelectorAll('[data-slot="markdown"]')[1]?.textContent).toContain(
        "A list that has started",
      ),
    );
  });
});
