/**
 * Stackra file contract:
 * Purpose: proves the web BulkActionBar draws a named toolbar with the count, one button per action and a clear
 *          button only while records are selected, keeps one empty polite status in the page from the start and fills
 *          it with the count, runs an action once and shows it busy while its promise is pending, refuses a second
 *          press, ends the busy state when the promise settles or rejects and never touches the selection, refuses a
 *          disabled action and names why, offers "select all N" only for a fully selected page with a total above the
 *          selected count and a handler, turns the same button into "select only the rows shown" while all matching is
 *          chosen and reads the total as the count, draws an action with an `href` as a link, clears through
 *          `onClearSelection`, passes the root's other props through and refuses the raw names the contract replaces.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-190 sta-350:FR-192
import { act, render, screen, within } from "@testing-library/react";

import type { BulkActionBarContractProps } from "#contracts/types/bulk-action-bar-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import { BulkActionBar } from "#react/bulk-action-bar/bulk-action-bar";
import type { BulkActionBarProps } from "#react/bulk-action-bar/bulk-action-bar.props";

const press = (element: HTMLElement) => act(() => element.click());
const offers = () => screen.queryByRole("button", { name: /^Select all/ });

/** A promise the test settles by hand, so a pending action stays pending for as long as the test wants. */
function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const baseProps = {
  selectedCount: 3,
  actions: [{ id: "archive", label: "Archive" }] as readonly ResourceAction[],
  onClearSelection: () => undefined,
} satisfies BulkActionBarProps;

describe("BulkActionBar (web)", () => {
  it("draws nothing visible while nothing is selected, but keeps its empty polite status", () => {
    const { container } = render(<BulkActionBar {...baseProps} selectedCount={0} />);
    expect(screen.queryByRole("toolbar")).toBeNull();
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toBe("");
  });

  it("draws a toolbar named by its label with the count, a button per action and a clear button", () => {
    render(
      <BulkActionBar
        {...baseProps}
        label="Order actions"
        actions={[
          { id: "archive", label: "Archive" },
          { id: "delete", label: "Delete", tone: "danger" },
        ]}
      />,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Order actions" });
    expect(within(toolbar).getByText("3 selected")).toBeTruthy();
    expect(
      within(toolbar)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Archive", "Delete", "Clear selection"]);
  });

  it("announces the count politely through a status that was already in the page", () => {
    const { container, rerender } = render(<BulkActionBar {...baseProps} selectedCount={0} />);
    const status = container.querySelector('[role="status"]');
    rerender(<BulkActionBar {...baseProps} selectedCount={2} />);
    expect(container.querySelector('[role="status"]')).toBe(status);
    expect(status?.textContent).toBe("2 selected");
    rerender(<BulkActionBar {...baseProps} selectedCount={2} countLabel={(n) => `${n} orders`} />);
    expect(status?.textContent).toBe("2 orders");
  });

  it("runs an action on press and shows it busy while its promise is pending, refusing a second press", async () => {
    const work = deferred();
    const onPress = vi.fn(() => work.promise);
    render(
      <BulkActionBar {...baseProps} actions={[{ id: "archive", label: "Archive", onPress }]} />,
    );
    const archive = screen.getByRole("button", { name: "Archive" });
    press(archive);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(archive.hasAttribute("data-pending")).toBe(true);
    press(archive);
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(archive.hasAttribute("data-pending")).toBe(false);
    press(archive);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it("ends the busy state when the promise rejects and leaves the selection alone", async () => {
    const work = deferred();
    const onClearSelection = vi.fn();
    render(
      <BulkActionBar
        {...baseProps}
        onClearSelection={onClearSelection}
        actions={[{ id: "archive", label: "Archive", onPress: () => work.promise }]}
      />,
    );
    const archive = screen.getByRole("button", { name: "Archive" });
    press(archive);
    expect(archive.hasAttribute("data-pending")).toBe(true);
    await act(async () => {
      work.reject(new Error("the server said no"));
      await work.promise.catch(() => undefined);
    });
    expect(archive.hasAttribute("data-pending")).toBe(false);
    expect(onClearSelection).not.toHaveBeenCalled();
    expect(screen.getByRole("toolbar")).toBeTruthy();
  });

  it("runs an action that returns nothing without marking it busy", () => {
    const onPress = vi.fn();
    render(
      <BulkActionBar {...baseProps} actions={[{ id: "archive", label: "Archive", onPress }]} />,
    );
    const archive = screen.getByRole("button", { name: "Archive" });
    press(archive);
    press(archive);
    expect(onPress).toHaveBeenCalledTimes(2);
    expect(archive.hasAttribute("data-pending")).toBe(false);
  });

  it("refuses a disabled action by press and says why in its accessible name", () => {
    const onPress = vi.fn();
    render(
      <BulkActionBar
        {...baseProps}
        actions={[
          {
            id: "delete",
            label: "Delete",
            isDisabled: true,
            disabledReason: "Paid orders stay",
            onPress,
          },
        ]}
      />,
    );
    const button = screen.getByRole("button", { name: "Delete: Paid orders stay" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("draws an action with an href as a link, and a disabled one as a refused button", () => {
    render(
      <BulkActionBar
        {...baseProps}
        actions={[
          { id: "export", label: "Export", href: "/exports/new" },
          { id: "print", label: "Print", href: "/print", isDisabled: true },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Export" }).getAttribute("href")).toBe("/exports/new");
    expect(screen.queryByRole("link", { name: "Print" })).toBeNull();
    expect((screen.getByRole("button", { name: "Print" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("offers select all N only for a fully selected page, with a total above the count and a handler", () => {
    const onAllMatchingSelectedChange = vi.fn();
    const { rerender } = render(
      <BulkActionBar
        {...baseProps}
        totalCount={245}
        isPageSelected
        onAllMatchingSelectedChange={onAllMatchingSelectedChange}
      />,
    );
    press(screen.getByRole("button", { name: "Select all 245" }));
    expect(onAllMatchingSelectedChange).toHaveBeenCalledWith(true);

    rerender(
      <BulkActionBar {...baseProps} totalCount={245} onAllMatchingSelectedChange={() => {}} />,
    );
    expect(offers()).toBeNull();
    rerender(
      <BulkActionBar {...baseProps} isPageSelected onAllMatchingSelectedChange={() => {}} />,
    );
    expect(offers()).toBeNull();
    rerender(
      <BulkActionBar
        {...baseProps}
        selectedCount={3}
        totalCount={3}
        isPageSelected
        onAllMatchingSelectedChange={() => {}}
      />,
    );
    expect(offers()).toBeNull();
    rerender(<BulkActionBar {...baseProps} totalCount={245} isPageSelected />);
    expect(offers()).toBeNull();
  });

  it("turns the choice into select only the rows shown, and reads the total as the count", () => {
    const onAllMatchingSelectedChange = vi.fn();
    render(
      <BulkActionBar
        {...baseProps}
        selectedCount={20}
        totalCount={245}
        isAllMatchingSelected
        onAllMatchingSelectedChange={onAllMatchingSelectedChange}
      />,
    );
    expect(screen.getByText("245 selected", { selector: "p, span" })).toBeTruthy();
    press(screen.getByRole("button", { name: "Select only the 20 shown" }));
    expect(onAllMatchingSelectedChange).toHaveBeenCalledWith(false);
  });

  it("writes its own sentences when given them", () => {
    render(
      <BulkActionBar
        {...baseProps}
        totalCount={245}
        isPageSelected
        onAllMatchingSelectedChange={() => {}}
        clearLabel="Deselect"
        selectAllLabel={(total) => `Pick all ${total}`}
      />,
    );
    expect(screen.getByRole("button", { name: "Deselect" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pick all 245" })).toBeTruthy();
  });

  it("clears through onClearSelection and does nothing else to the selection", () => {
    const onClearSelection = vi.fn();
    render(<BulkActionBar {...baseProps} onClearSelection={onClearSelection} />);
    press(screen.getByRole("button", { name: "Clear selection" }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("passes the root's other props through", () => {
    const { container } = render(<BulkActionBar {...baseProps} data-testid="bar" id="bar-1" />);
    const root = container.firstElementChild;
    expect(root?.getAttribute("data-testid")).toBe("bar");
    expect(root?.id).toBe("bar-1");
  });

  it("extends the contract and refuses the names it replaces", () => {
    expectTypeOf<BulkActionBarProps>().toExtend<BulkActionBarContractProps>();
    // @ts-expect-error -- the bar's children are its actions
    const withChildren: BulkActionBarProps = { ...baseProps, children: "x" };
    // @ts-expect-error -- `batchActions` is a raw name; the contract's word is `actions`
    const raw: BulkActionBarProps = { ...baseProps, batchActions: [] };
    expect([withChildren, raw]).toHaveLength(2);
  });
});
