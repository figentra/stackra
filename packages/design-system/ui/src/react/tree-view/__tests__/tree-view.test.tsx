/**
 * Stackra file contract:
 * Purpose: proves the web TreeView is a tree named by its label, hides children until their parent is expanded,
 *          reports the expanded and selected ids in list order, activates rows, and turns its chevron the other way in
 *          a right-to-left locale.
 * Boundary: jsdom with real React Aria; motion's fade is not checked.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 22.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { TreeView } from "#react/tree-view/tree-view";

const ACCOUNTS: readonly TreeViewNode[] = [
  {
    id: "assets",
    label: "Assets",
    description: "1000",
    children: [
      { id: "cash", label: "Cash", description: "1100" },
      { id: "bank", label: "Bank", description: "1200" },
    ],
  },
  { id: "revenue", label: "Revenue", description: "4000" },
];

const chevronOf = (row: HTMLElement) =>
  row.querySelector<HTMLElement>("button[slot='chevron'], [slot='chevron']") ??
  row.querySelector<HTMLElement>("button");

/** The element the chevron of the Assets row turns. */
const turn = () =>
  chevronOf(screen.getByRole("row", { name: "Assets" }))?.querySelector<HTMLElement>("span");

describe("TreeView (web)", () => {
  it("is a tree named by its label whose children show once their parent is expanded", () => {
    const onExpandedChange = vi.fn();
    render(
      <TreeView items={ACCOUNTS} label="Chart of accounts" onExpandedChange={onExpandedChange} />,
    );
    expect(screen.getByRole("treegrid", { name: "Chart of accounts" })).toBeTruthy();
    expect(screen.queryByText("Cash")).toBeNull();
    const assets = screen.getByRole("row", { name: "Assets" });
    act(() => chevronOf(assets)?.click());
    expect(screen.getByText("Cash")).toBeTruthy();
    expect(onExpandedChange).toHaveBeenLastCalledWith(["assets"]);
  });

  it("reports the selection in list order and activates rows", () => {
    const onSelectionChange = vi.fn();
    render(
      <TreeView
        items={ACCOUNTS}
        label="Chart of accounts"
        selectionMode="multiple"
        defaultExpandedKeys={["assets"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    act(() => screen.getByText("Bank").click());
    act(() => screen.getByText("Cash").click());
    expect(onSelectionChange).toHaveBeenLastCalledWith(["cash", "bank"]);
  });

  it("checks every row under a checked parent when checks propagate, and dashes a partly checked one", () => {
    const onSelectionChange = vi.fn();
    render(
      <TreeView
        items={ACCOUNTS}
        label="Chart of accounts"
        selectionMode="multiple"
        isSelectionPropagated
        defaultExpandedKeys={["assets"]}
        onSelectionChange={onSelectionChange}
      />,
    );
    act(() => screen.getByText("Assets").click());
    expect(onSelectionChange).toHaveBeenLastCalledWith(["assets", "cash", "bank"]);
    act(() => screen.getByText("Cash").click());
    expect(onSelectionChange).toHaveBeenLastCalledWith(["bank"]);
    const assets = screen.getByRole("row", { name: "Assets" });
    expect(assets.querySelector("[data-indeterminate]")).toBeTruthy();
  });

  it("loads a row's children the first time it opens, with a loading row meanwhile", async () => {
    // jsdom has no IntersectionObserver; React Aria's loading row watches its sentinel with one.
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}

        unobserve() {}

        disconnect() {}
      },
    );
    let resolve: ((rows: readonly TreeViewNode[]) => void) | undefined;
    const onLoadChildren = vi.fn(
      () =>
        new Promise<readonly TreeViewNode[]>((done) => {
          resolve = done;
        }),
    );
    render(
      <TreeView
        items={[{ id: "region", label: "Riyadh region", hasChildren: true }]}
        label="Branches"
        onLoadChildren={onLoadChildren}
      />,
    );
    act(() => chevronOf(screen.getByRole("row", { name: "Riyadh region" }))?.click());
    expect(onLoadChildren).toHaveBeenCalledWith("region");
    expect(screen.getByText("Loading…")).toBeTruthy();
    await act(async () => resolve?.([{ id: "olaya", label: "Olaya" }]));
    expect(screen.getByText("Olaya")).toBeTruthy();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("gives each row a drag handle when rows can be moved", () => {
    render(<TreeView items={ACCOUNTS} label="Chart of accounts" onMove={() => undefined} />);
    const assets = screen.getByRole("row", { name: "Assets" });
    expect(assets.querySelector("[slot='drag']")).toBeTruthy();
  });

  it("leaves the mirrored chevron pointing left in a right-to-left locale and turns it down the other way", () => {
    render(
      <I18nProvider locale="ar">
        <TreeView items={ACCOUNTS} label="دليل الحسابات" />
      </I18nProvider>,
    );
    expect(turn()?.style.rotate).toBe("0deg");
    act(() => chevronOf(screen.getByRole("row", { name: "Assets" }))?.click());
    expect(turn()?.style.rotate).toBe("-90deg");
  });
});
