/**
 * Stackra file contract:
 * Purpose: proves the web Markdown renders GitHub-flavoured Markdown (headings, emphasis, tables, line breaks), draws
 *          a custom element from `components`, and passes unknown props through.
 * Boundary: jsdom with real HeroUI Pro and real `react-markdown`; the theme CSS is not loaded, so classes are
 *          checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { render, screen } from "@testing-library/react";

import { Markdown } from "#react/markdown/markdown";

describe("Markdown (web)", () => {
  it("renders Markdown as HTML and passes unknown props through", () => {
    render(
      <Markdown className="extra" data-testid="doc">
        {"# Title\n\nSome **bold** text.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n"}
      </Markdown>,
    );
    const doc = screen.getByTestId("doc");
    expect(doc.classList.contains("extra")).toBe(true);
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(doc.querySelector("strong")?.textContent).toBe("bold");
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("keeps single line breaks", () => {
    render(<Markdown data-testid="doc">{"one\ntwo"}</Markdown>);
    expect(screen.getByTestId("doc").querySelector("br")).toBeTruthy();
  });

  it("draws an element from the components map", () => {
    render(
      <Markdown components={{ em: (props) => <mark data-testid="em" {...props} /> }}>
        {"an *accent*"}
      </Markdown>,
    );
    expect(screen.getByTestId("em").textContent).toBe("accent");
  });
});
