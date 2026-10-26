/**
 * Stackra file contract:
 * Purpose: proves the web FileTree names its tree from `label`, maps `size` and `isMotionReduced` to HeroUI Pro's
 *          `size` and `reduceMotion`, leaves both absent when not given, draws items, passes the item's `onPress`
 *          and unknown props through, carries HeroUI Pro's own parts and hooks, and refuses HeroUI Pro's names.
 * Boundary: jsdom with real HeroUI Pro and React Aria. The root is wrapped in a recording component that renders
 *          HeroUI Pro's own root with the same props, because `reduceMotion` leaves no mark in the DOM; the theme
 *          CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import * as heroFileTree from "@heroui-pro/react/file-tree";
import type { Size } from "@stackra/ui/contracts";
import { fireEvent, render, screen } from "@testing-library/react";

import { FileTree, useFileTree, useFileTreeDrag } from "#react/file-tree/file-tree";
import type { FileTreeProps } from "#react/file-tree/file-tree.props";

const rootProps = vi.hoisted(() => [] as Record<string, unknown>[]);

vi.mock("@heroui-pro/react/file-tree", async (importOriginal) => {
  const actual = await importOriginal<typeof heroFileTree>();
  const Root = (props: Record<string, unknown>) => {
    rootProps.push(props);
    // A call, not an element: this factory runs before the JSX runtime import is bound.
    return (actual.FileTree.Root as (p: Record<string, unknown>) => unknown)(props);
  };
  return { ...actual, FileTree: { ...actual.FileTree, Root } };
});

function Tree(props: Partial<FileTreeProps<object>>) {
  return (
    <FileTree label="Project" {...props}>
      <FileTree.Item id="src" title="src">
        <FileTree.Item id="main" title="main.ts" />
      </FileTree.Item>
      <FileTree.Item id="readme" title="README.md" />
    </FileTree>
  );
}

describe("FileTree (web)", () => {
  beforeEach(() => {
    rootProps.length = 0;
  });

  it("names the tree from label and draws its items", () => {
    render(<Tree defaultExpandedKeys={["src"]} />);
    expect(screen.getByRole("treegrid", { name: "Project" })).toBeTruthy();
    expect(screen.getByText("src")).toBeTruthy();
    expect(screen.getByText("main.ts")).toBeTruthy();
    expect(screen.getByText("README.md")).toBeTruthy();
  });

  it("maps size, isMotionReduced and label, and leaves them absent when not given", () => {
    render(<Tree size="lg" isMotionReduced />);
    expect(rootProps.at(-1)).toMatchObject({
      size: "lg",
      reduceMotion: true,
      "aria-label": "Project",
    });
    rootProps.length = 0;
    render(<Tree />);
    const plain = rootProps.at(-1) ?? {};
    expect("size" in plain).toBe(false);
    expect("reduceMotion" in plain).toBe(false);
    expect("isMotionReduced" in plain).toBe(false);
    expect("label" in plain).toBe(false);
  });

  it("presses an item through React Aria's own onPress and passes unknown props through", () => {
    const onPress = vi.fn();
    render(
      <FileTree label="Project" data-testid="tree" className="extra" selectionMode="single">
        <FileTree.Item id="readme" title="README.md" onPress={onPress} />
      </FileTree>,
    );
    const tree = screen.getByTestId("tree");
    expect(tree.classList.contains("extra")).toBe(true);
    const row = screen.getByRole("row", { name: "README.md" });
    fireEvent.mouseDown(row);
    fireEvent.mouseUp(row);
    fireEvent.click(row);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("carries HeroUI Pro's own parts and hooks", () => {
    for (const part of ["Item", "Indicator", "Section", "Header"] as const) {
      expect(FileTree[part]).toBe(heroFileTree.FileTree[part]);
    }
    expect(useFileTree).toBe(heroFileTree.useFileTree);
    expect(useFileTreeDrag).toBe(heroFileTree.useFileTreeDrag);
  });

  it("takes the vocabulary names, and refuses HeroUI Pro's aria-label and reduceMotion", () => {
    expectTypeOf<FileTreeProps<object>["label"]>().toEqualTypeOf<string>();
    expectTypeOf<FileTreeProps<object>["size"]>().toEqualTypeOf<Size | undefined>();
    expectTypeOf<FileTreeProps<object>>().toHaveProperty("isMotionReduced");
    expectTypeOf<FileTreeProps<object>>().not.toHaveProperty("aria-label");
    expectTypeOf<FileTreeProps<object>>().not.toHaveProperty("reduceMotion");
  });
});
