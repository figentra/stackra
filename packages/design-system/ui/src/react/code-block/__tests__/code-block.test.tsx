/**
 * Stackra file contract:
 * Purpose: proves the web `CodeBlock` colours tokens with the syntax variables, fills its container, marks highlighted
 *          and diff lines (as `ins` and `del`), keeps a prompt out of the text, collapses past `maxLines` behind a
 *          "Show all" button with no inner vertical scroll, toggles wrapping, and shows files as tabs.
 * Boundary: jsdom with real HeroUI.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { CodeBlock } from "#react/code-block/code-block";

const LINES = Array.from({ length: 40 }, (_, index) => `const line${index} = ${index};`).join("\n");

describe("CodeBlock (web)", () => {
  it("colours tokens and fills its container", () => {
    const { container } = render(<CodeBlock code="const a = 1;" language="ts" />);
    const keyword = [...container.querySelectorAll("code span[style]")].find(
      (span) => span.textContent === "const",
    );
    expect(keyword?.getAttribute("style")).toContain("var(--syntax-keyword)");
    const figure = container.querySelector("figure") as HTMLElement;
    expect(figure.style.inlineSize).toBe("100%");
  });

  it("marks highlighted, inserted and deleted lines and copies the diff's result", () => {
    const { container } = render(
      <CodeBlock code={" a\n-b\n+c"} isDiff highlightLines={[1]} isCopyable={false} />,
    );
    expect(container.querySelector("del")?.textContent).toBe("b");
    expect(container.querySelector("ins")?.textContent).toBe("c");
    const first = container.querySelector("code > span") as HTMLElement;
    expect(first.style.background).toContain("--accent");
  });

  it("draws a prompt that is not part of the code text", () => {
    const { container } = render(
      <CodeBlock code="pnpm i" language="bash" prompt="$" isCopyable={false} />,
    );
    const prompt = [...container.querySelectorAll("[aria-hidden]")].find(
      (node) => node.textContent === "$",
    );
    expect(prompt?.className).toContain("select-none");
  });

  it("collapses past maxLines behind Show all, then shows every line", () => {
    const { container } = render(<CodeBlock code={LINES} maxLines={10} isCopyable={false} />);
    expect(container.querySelectorAll("code > span")).toHaveLength(10);
    fireEvent.click(screen.getByRole("button", { name: "Show all 40 lines" }));
    expect(container.querySelectorAll("code > span")).toHaveLength(40);
    expect(
      screen.getByRole("button", { name: "Show fewer lines" }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("toggles wrapping from the header", () => {
    const { container } = render(<CodeBlock code="a" showWrapToggle isCopyable={false} />);
    const toggle = screen.getByRole("button", { name: "Wrap long lines" });
    fireEvent.click(toggle);
    expect(container.querySelector("code span span")?.className).toContain("whitespace-pre-wrap");
  });

  it("shows several files as tabs", () => {
    // jsdom has no ResizeObserver; HeroUI's tab indicator measures with one.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    render(
      <CodeBlock
        isCopyable={false}
        files={[
          { title: "app.ts", code: "a", language: "ts" },
          { title: "app.css", code: "b", language: "css" },
        ]}
      />,
    );
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["app.ts", "app.css"]);
  });
});
