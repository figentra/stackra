/**
 * Stackra file contract:
 * Purpose: proves the native Code is a monospaced Text holding the code.
 * Boundary: Text is a `span` stand-in that keeps its class name.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Code } from "#native/code/code";

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: { className?: string; children?: string }) =>
      createElement("span", { className: props.className }, props.children),
  };
});

describe("Code (native)", () => {
  it("draws the code in the monospaced face", () => {
    render(<Code>pnpm gen</Code>);
    expect(screen.getByText("pnpm gen").className).toContain("font-mono");
  });
});
