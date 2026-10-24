/**
 * Stackra file contract:
 * Purpose: proves the FileTree page sits at /pro-file-tree in the Pro category, titles the page and the document, draws
 *          two named trees, shows the first tree's expanded folders, and reports the file chosen.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProFileTree } from "#src/routes/pro-file-tree/pro-file-tree";
import { ProFileTreeRoute } from "#src/routes/pro-file-tree/pro-file-tree.route";

describe("ProFileTree", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-file-tree in the Pro category, and titles the page and the document", () => {
    render(<ProFileTree />);
    expect(ProFileTreeRoute.path).toBe("/pro-file-tree");
    expect(ProFileTreeRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProFileTreeRoute.title })).toBeTruthy();
    expect(document.title).toBe("FileTree · Stackra Playground");
  });

  it("draws two named trees, the first with its folders expanded", () => {
    render(<ProFileTree />);
    expect(screen.getByRole("treegrid", { name: "Project structure" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Project structure without motion" })).toBeTruthy();
    expect(screen.getByText("main.ts")).toBeTruthy();
  });

  it("reports the file chosen", () => {
    render(<ProFileTree />);
    expect(screen.getByRole("status").textContent).toBe("No file is selected.");
    fireEvent.click(screen.getByText("main.ts"));
    expect(screen.getByRole("status").textContent).toBe("Selected: console-main");
  });
});
