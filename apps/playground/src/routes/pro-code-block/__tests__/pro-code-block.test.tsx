/**
 * Stackra file contract:
 * Purpose: proves the CodeBlock page sits at /pro-code-block in the Pro category, titles the page and the document, and draws a block for TypeScript and for JSON, each with its language and a named copy button.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProCodeBlock } from "#src/routes/pro-code-block/pro-code-block";
import { ProCodeBlockRoute } from "#src/routes/pro-code-block/pro-code-block.route";

describe("ProCodeBlock", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-code-block in the Pro category, and titles the page and the document", () => {
    render(<ProCodeBlock />);
    expect(ProCodeBlockRoute.path).toBe("/pro-code-block");
    expect(ProCodeBlockRoute.category).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProCodeBlockRoute.title })).toBeTruthy();
    expect(document.title).toBe("CodeBlock · Stackra Playground");
  });

  it("labels each block with its language and names its copy button", () => {
    render(<ProCodeBlock />);
    expect(screen.getAllByRole("button", { name: "Copy the code" })).toHaveLength(2);
    expect(screen.getByText("typescript")).toBeTruthy();
    expect(screen.getByText("json")).toBeTruthy();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(["TypeScript", "JSON"]);
  });
});
