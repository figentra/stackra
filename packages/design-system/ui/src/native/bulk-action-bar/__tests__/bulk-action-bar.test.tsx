/**
 * Stackra file contract:
 * Purpose: proves the native BulkActionBar, the adapted form, draws nothing while nothing is selected, otherwise a
 *          toolbar `View` named by its label with the count wrapped in `Text` and announced through the platform once
 *          for each change, the first two actions as buttons and every later one in the inset sheet that the "more"
 *          button opens (choosing one closes the sheet and runs it), runs an action once and hands the button its busy
 *          state while the promise is pending, refuses a second tap, ends the busy state when the promise settles or
 *          rejects and never touches the selection, passes a disabled action's refusal and its reason on in the
 *          accessible name, follows an `href` after the action's own handler, offers "select all N" only for a fully
 *          selected page with a total above the count and a handler and turns it into "select only the rows shown",
 *          clears through `onClearSelection`, and passes the root's other props through.
 * Boundary: React Native does not render in vitest, so react-native, the Drawer, Button, IconButton and Text are
 *           replaced by recording stand-ins that render plain DOM; what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6 and 10); ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-188 sta-350:FR-191 sta-350:FR-192
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ResourceAction } from "#contracts/types/resource-action.type";
import { BulkActionBar } from "#native/bulk-action-bar/bulk-action-bar";
import type { BulkActionBarProps } from "#native/bulk-action-bar/bulk-action-bar.props";

/** What the stand-ins were last handed, and the platform calls made. */
const received = vi.hoisted(() => ({
  announcements: [] as string[],
  drawer: {} as Record<string, unknown>,
  followed: [] as string[],
  texts: [] as Record<string, unknown>[],
  view: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: {
      announceForAccessibility: (text: string) => received.announcements.push(text),
    },
    View: (props: Record<string, unknown>) => {
      received.view = props;
      return createElement(
        "div",
        { "data-testid": "bar", "data-role": props["role"] },
        props["children"] as ReactNode,
      );
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      received.texts.push(props);
      return createElement("span", {}, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          "aria-label": props["label"] as string | undefined,
          "data-loading": props["isLoading"] ? "true" : undefined,
          "data-variant": props["variant"] as string,
          "data-disabled": props["isDisabled"] ? "true" : undefined,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        "aria-label": props["label"] as string,
        "data-loading": props["isLoading"] ? "true" : undefined,
        onClick: props["onPress"] as () => void,
      }),
  };
});

vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (name: string) => (props: Record<string, unknown>) =>
    createElement("div", { "data-part": name }, props["children"] as ReactNode);
  const Close = (props: Record<string, unknown>) =>
    createElement("button", { "aria-label": props["label"] as string, "data-part": "close" });
  return {
    Drawer: Object.assign(
      (props: Record<string, unknown>) => {
        received.drawer = props;
        return props["isOpen"]
          ? createElement("div", { "data-testid": "sheet" }, props["children"] as ReactNode)
          : null;
      },
      { Header: part("header"), Title: part("title"), Body: part("body"), Close },
    ),
  };
});

vi.mock("#native/router-provider/follow-href.function", () => ({
  followHref: (href: string) => received.followed.push(href),
}));

const click = (element: HTMLElement) => act(() => void fireEvent.click(element));
const offers = () => screen.queryByRole("button", { name: /^Select all/ });
const archive = () => screen.getByRole("button", { name: "Archive" });

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

const THREE: readonly ResourceAction[] = [
  { id: "archive", label: "Archive" },
  { id: "export", label: "Export" },
  { id: "delete", label: "Delete", tone: "danger" },
];

describe("BulkActionBar (native)", () => {
  beforeEach(() => {
    received.announcements = [];
    received.drawer = {};
    received.followed = [];
    received.texts = [];
    received.view = {};
  });

  it("draws nothing while nothing is selected", () => {
    const { container } = render(<BulkActionBar {...baseProps} selectedCount={0} />);
    expect(container.firstChild).toBeNull();
    expect(received.announcements).toEqual([]);
  });

  it("draws a toolbar named by its label with the count as Text", () => {
    render(<BulkActionBar {...baseProps} label="Order actions" />);
    expect(received.view["role"]).toBe("toolbar");
    expect(received.view["accessibilityLabel"]).toBe("Order actions");
    expect(screen.getByText("3 selected").tagName).toBe("SPAN");
    expect(received.texts.map((text) => text["children"])).toContain("3 selected");
  });

  it("announces the count once for each change, not for each render", () => {
    const { rerender } = render(<BulkActionBar {...baseProps} countLabel={(n) => `${n} picked`} />);
    rerender(<BulkActionBar {...baseProps} countLabel={(n) => `${n} picked`} />);
    expect(received.announcements).toEqual(["3 picked"]);
    rerender(<BulkActionBar {...baseProps} selectedCount={4} countLabel={(n) => `${n} picked`} />);
    expect(received.announcements).toEqual(["3 picked", "4 picked"]);
  });

  it("draws the first two actions as buttons and the rest in the inset sheet behind a more button", () => {
    render(<BulkActionBar {...baseProps} actions={THREE} moreActionsLabel="More order actions" />);
    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.queryByTestId("sheet")).toBeNull();

    click(screen.getByRole("button", { name: "More order actions" }));
    const sheet = screen.getByTestId("sheet");
    expect(sheet.querySelector('[data-part="title"]')?.textContent).toBe("More order actions");
    expect(sheet.querySelector('[data-part="body"]')?.textContent).toBe("Delete");
    expect(sheet.querySelector('[data-part="close"]')?.getAttribute("aria-label")).toBe("Close");
    expect(screen.getByRole("button", { name: "Delete" }).getAttribute("data-variant")).toBe(
      "danger-soft",
    );
  });

  it("closes the sheet and runs the action that was chosen in it", () => {
    const onPress = vi.fn();
    render(
      <BulkActionBar
        {...baseProps}
        actions={[...THREE.slice(0, 2), { id: "delete", label: "Delete", onPress }]}
      />,
    );
    click(screen.getByRole("button", { name: "More actions" }));
    click(screen.getByRole("button", { name: "Delete" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("has no more button and no sheet when every action fits", () => {
    render(<BulkActionBar {...baseProps} actions={THREE.slice(0, 2)} />);
    expect(screen.queryByRole("button", { name: "More actions" })).toBeNull();
    expect(received.drawer).toEqual({});
  });

  it("runs an action once and shows it busy while its promise is pending", async () => {
    const work = deferred();
    const onPress = vi.fn(() => work.promise);
    render(
      <BulkActionBar {...baseProps} actions={[{ id: "archive", label: "Archive", onPress }]} />,
    );
    click(archive());
    click(archive());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(archive().getAttribute("data-loading")).toBe("true");
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(archive().getAttribute("data-loading")).toBeNull();
    click(archive());
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
    click(screen.getByRole("button", { name: "Archive" }));
    expect(screen.getByRole("button", { name: "Archive" }).getAttribute("data-loading")).toBe(
      "true",
    );
    await act(async () => {
      work.reject(new Error("the server said no"));
      await work.promise.catch(() => undefined);
    });
    expect(screen.getByRole("button", { name: "Archive" }).getAttribute("data-loading")).toBeNull();
    expect(onClearSelection).not.toHaveBeenCalled();
  });

  it("shows the more button busy while an action in the sheet is pending", async () => {
    const work = deferred();
    render(
      <BulkActionBar
        {...baseProps}
        actions={[
          ...THREE.slice(0, 2),
          { id: "delete", label: "Delete", onPress: () => work.promise },
        ]}
      />,
    );
    click(screen.getByRole("button", { name: "More actions" }));
    click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("button", { name: "More actions" }).getAttribute("data-loading")).toBe(
      "true",
    );
    await act(async () => {
      work.resolve();
      await work.promise;
    });
    expect(
      screen.getByRole("button", { name: "More actions" }).getAttribute("data-loading"),
    ).toBeNull();
  });

  it("hands a disabled action's refusal on and names why in the accessible name", () => {
    render(
      <BulkActionBar
        {...baseProps}
        actions={[
          { id: "delete", label: "Delete", isDisabled: true, disabledReason: "Paid orders stay" },
        ]}
      />,
    );
    const button = screen.getByRole("button", { name: "Delete: Paid orders stay" });
    expect(button.getAttribute("data-disabled")).toBe("true");
  });

  it("follows an href after the action's own handler", () => {
    const order: string[] = [];
    render(
      <BulkActionBar
        {...baseProps}
        actions={[
          {
            id: "export",
            label: "Export",
            href: "/exports/new",
            onPress: () => void order.push("onPress"),
          },
        ]}
      />,
    );
    click(screen.getByRole("button", { name: "Export" }));
    expect(order).toEqual(["onPress"]);
    expect(received.followed).toEqual(["/exports/new"]);
  });

  it("offers select all N for a fully selected page and turns it into select only the rows shown", () => {
    const onAllMatchingSelectedChange = vi.fn();
    const { rerender } = render(
      <BulkActionBar
        {...baseProps}
        totalCount={245}
        isPageSelected
        onAllMatchingSelectedChange={onAllMatchingSelectedChange}
      />,
    );
    click(screen.getByRole("button", { name: "Select all 245" }));
    expect(onAllMatchingSelectedChange).toHaveBeenLastCalledWith(true);

    rerender(
      <BulkActionBar
        {...baseProps}
        selectedCount={20}
        totalCount={245}
        isAllMatchingSelected
        onAllMatchingSelectedChange={onAllMatchingSelectedChange}
      />,
    );
    expect(screen.getByText("245 selected")).toBeTruthy();
    click(screen.getByRole("button", { name: "Select only the 20 shown" }));
    expect(onAllMatchingSelectedChange).toHaveBeenLastCalledWith(false);
  });

  it("offers no select all N for a partly selected page, without a total or without a handler", () => {
    const { rerender } = render(
      <BulkActionBar {...baseProps} totalCount={245} onAllMatchingSelectedChange={() => {}} />,
    );
    expect(offers()).toBeNull();
    rerender(
      <BulkActionBar {...baseProps} isPageSelected onAllMatchingSelectedChange={() => {}} />,
    );
    expect(offers()).toBeNull();
    rerender(<BulkActionBar {...baseProps} totalCount={245} isPageSelected />);
    expect(offers()).toBeNull();
  });

  it("clears through onClearSelection", () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionBar {...baseProps} onClearSelection={onClearSelection} clearLabel="Deselect" />,
    );
    click(screen.getByRole("button", { name: "Deselect" }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it("passes the root's other props through and keeps the caller's class", () => {
    render(<BulkActionBar {...baseProps} testID="bar-1" className="mine" />);
    expect(received.view["testID"]).toBe("bar-1");
    expect(String(received.view["className"])).toContain("mine");
  });

  it("refuses the children and the names the contract replaces", () => {
    // @ts-expect-error -- the bar's children are its actions
    const withChildren: BulkActionBarProps = { ...baseProps, children: "x" };
    // @ts-expect-error -- `batchActions` is a raw name; the contract's word is `actions`
    const raw: BulkActionBarProps = { ...baseProps, batchActions: [] };
    expect([withChildren, raw]).toHaveLength(2);
  });
});
