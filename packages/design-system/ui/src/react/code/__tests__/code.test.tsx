/**
 * Stackra file contract:
 * Purpose: proves the web Code is a left-to-right `code` element with its text, and that the MarkdownViewer draws
 *          inline code with it.
 * Boundary: jsdom; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { Code } from "#react/code/code";
import { MarkdownViewer } from "#react/code-block/markdown-viewer";

describe("Code (web)", () => {
  it("is a left-to-right code element", () => {
    const { container } = render(<Code>pnpm install</Code>);
    const code = container.querySelector("code");
    expect(code?.textContent).toBe("pnpm install");
    expect(code?.getAttribute("dir")).toBe("ltr");
  });

  it("draws the MarkdownViewer's inline code", () => {
    const { container } = render(<MarkdownViewer source="Run `pnpm gen` first." />);
    expect(container.querySelector("[data-slot=code]")?.textContent).toBe("pnpm gen");
  });
});
