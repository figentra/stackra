/**
 * Stackra file contract:
 * Purpose: proves the web JsonViewer: a labelled, always left-to-right group that draws objects and arrays as
 *          collapsible nodes open to `defaultExpandDepth`, with their keys, entry counts and each leaf kind
 *          (string, number, boolean, null); a bare leaf draws without a node.
 * Boundary: jsdom; the syntax colours come from CSS variables, so only the variable names are checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { JsonViewer } from "#react/code-block/json-viewer";

describe("JsonViewer (web)", () => {
  it("draws nested objects and arrays open to the expand depth with every leaf kind", () => {
    render(
      <JsonViewer
        label="Payload"
        value={{ name: "Sara", age: 3, ok: true, none: null, tags: ["a", { deep: 1 }] }}
        defaultExpandDepth={2}
      />,
    );
    const group = screen.getByRole("group", { name: "Payload" });
    expect(group.getAttribute("dir")).toBe("ltr");
    const details = group.querySelectorAll("details");
    expect(details).toHaveLength(3);
    expect([...details].map((node) => node.open)).toEqual([true, true, false]);
    expect(group.textContent).toContain('"Sara"');
    expect(group.textContent).toContain("null");
    expect(group.textContent).toContain("true");
    expect(screen.getByText("3").getAttribute("style")).toContain("--syntax-number");
    expect(screen.getByText("tags:")).toBeTruthy();
  });

  it("collapses below the default depth and draws a bare leaf", () => {
    const { rerender, container } = render(<JsonViewer label="P" value={{ a: { b: 1 } }} />);
    expect([...container.querySelectorAll("details")].map((node) => node.open)).toEqual([
      true,
      false,
    ]);
    rerender(<JsonViewer label="P" value="plain" />);
    expect(container.querySelector("details")).toBeNull();
    expect(screen.getByText('"plain"')).toBeTruthy();
  });
});
