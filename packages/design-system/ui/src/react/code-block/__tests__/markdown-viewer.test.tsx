/**
 * Stackra file contract:
 * Purpose: proves the web `MarkdownViewer` draws headings, lists and links as elements, keeps HTML as text and drops
 *          unsafe links, and the `CodeBlock` shows the code left to right with line numbers.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { CodeBlock } from "#react/code-block/code-block";
import { MarkdownViewer } from "#react/code-block/markdown-viewer";

describe("MarkdownViewer (web)", () => {
  it("draws the subset safely", () => {
    const { container } = render(
      <MarkdownViewer
        source={
          "## Notes\n\n- [docs](https://x.io)\n- [bad](javascript:x)\n\n<img src=x onerror=alert(1)>"
        }
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Notes" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "docs" }).getAttribute("rel")).toBe(
      "noopener noreferrer",
    );
    expect(screen.queryByRole("link", { name: "bad" })).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("CodeBlock (web)", () => {
  it("is a left-to-right, focusable block with line numbers", () => {
    render(<CodeBlock code={"a\nb"} title="app.ts" showLineNumbers isCopyable={false} />);
    const pre = screen.getByLabelText("app.ts");
    expect(pre.getAttribute("dir")).toBe("ltr");
    expect(pre.getAttribute("tabindex")).toBe("0");
    expect(pre.textContent).toBe("1a2b");
  });
});
