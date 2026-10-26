/**
 * Stackra file contract:
 * Purpose: proves the web CodeBlock draws HeroUI Pro's panel and its code, names the copy button from `label` (and
 *          keeps HeroUI Pro's "Copy code" without one), copies the code, passes unknown props through, and carries
 *          HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and real `shiki` (it runs in jsdom): the code is drawn plain first and the
 *          test waits for the highlighted token spans. The clipboard is stubbed because jsdom has none; the theme
 *          CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { CodeBlock as HeroCodeBlock } from "@heroui-pro/react/code-block";
import { render, screen, waitFor } from "@testing-library/react";

import { CodeBlock } from "#react/code-block/code-block";

describe("CodeBlock (web)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("draws the panel and its code and passes unknown props through", async () => {
    render(
      <CodeBlock id="b" className="extra" data-testid="panel">
        <CodeBlock.Header>example.ts</CodeBlock.Header>
        <CodeBlock.Code code="const a = 1;" language="typescript" data-testid="code" />
      </CodeBlock>,
    );
    const panel = screen.getByTestId("panel");
    expect(panel.id).toBe("b");
    expect(panel.classList.contains("extra")).toBe(true);
    expect(screen.getByText("example.ts")).toBeTruthy();
    expect(screen.getByTestId("code").textContent).toContain("const a = 1;");
    await waitFor(() =>
      expect(screen.getByTestId("code").querySelector("span[style]")).toBeTruthy(),
    );
    expect(screen.getByTestId("code").textContent).toContain("const a = 1;");
  });

  it("names the copy button from label and copies the code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CodeBlock.CopyButton label="Copy snippet" code="npm i" />);
    const button = screen.getByRole("button", { name: "Copy snippet" });
    expect(button.getAttribute("aria-label")).toBe("Copy snippet");
    button.click();
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("npm i"));
  });

  it("names the copy button from ui_pro::code_block.copy when no label is given", () => {
    render(<CodeBlock.CopyButton code="x" />);
    expect(screen.getByRole("button", { name: "Copy code" })).toBeTruthy();
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(CodeBlock.Header).toBe(HeroCodeBlock.Header);
    expect(CodeBlock.Code).toBe(HeroCodeBlock.Code);
  });
});
