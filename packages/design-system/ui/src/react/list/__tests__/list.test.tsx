/**
 * Stackra file contract:
 * Purpose: proves the web List is a plain named `ul` of rows with no widget role until it selects, draws a row's title,
 *          description, start icon, end content and chevron, makes a pressable row a button that runs `onPress` and
 *          refuses a disabled one, becomes a list box when it selects (one and several, controlled and not) and reports
 *          the ids in the items' order without ever calling a row's `onPress`, shows `emptyState` only when nothing
 *          loads, is busy and names one spinner while loading, calls `onLoadMore` when the end shows and only while
 *          `hasMore` and not loading, passes its root's props and the surface variant through, reveals its rows inside
 *          the surface unless `isAnimated` is off, and refuses the raw React Aria and HeroUI names the vocabulary
 *          replaces.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 *           `IntersectionObserver` is replaced by a stand-in that the test fires by hand.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313; ADR 0022 (test placement); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
// @vitest-environment jsdom
// @covers sta-350:FR-121 sta-350:FR-122 sta-350:FR-127 sta-350:FR-128 sta-350:P-064
// @covers sta-430:FR-008
import { defineIconRegistry } from "@stackra/icons";
import { IconRegistryProvider } from "@stackra/icons/react";
import { act, render as renderBare, screen, within } from "@testing-library/react";
import { ChevronRight, User } from "lucide-react";
import { createRef, type ReactElement, type ReactNode } from "react";

import { SurfaceVariant } from "#contracts/enums/surface-variant.enum";
import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-contract-props.type";
import { List, type ListProps } from "#react/list/list";

const registry = defineIconRegistry({ "chevron-right": ChevronRight, user: User });

/** Renders with the icon registry an app would provide. */
const render = (ui: ReactElement) =>
  renderBare(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IconRegistryProvider registry={registry}>{children}</IconRegistryProvider>
    ),
  });

const press = (element: HTMLElement) => act(() => element.click());

/** The text of every selected option, in order. */
const selectedNames = () =>
  screen
    .getAllByRole("option")
    .filter((option) => option.getAttribute("aria-selected") === "true")
    .map((option) => option.textContent);

const ITEMS: readonly ListItemData[] = [
  { id: "a", title: "Alpha", description: "First" },
  { id: "b", title: "Bravo", description: "Second" },
  { id: "c", title: "Charlie" },
];

/** The observers the stand-in has made, so a test can show the end to the list. */
const observers: { fire: () => void; disconnected: boolean }[] = [];

describe("List (web)", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        private readonly entry: { fire: () => void; disconnected: boolean };
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.entry = { fire: () => callback([{ isIntersecting: true }]), disconnected: false };
          observers.push(this.entry);
        }
        observe() {}
        disconnect() {
          this.entry.disconnected = true;
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is a named plain list of rows with no widget role", () => {
    render(<List label="Recent" items={ITEMS} />);
    const list = screen.getByRole("list", { name: "Recent" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("option")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("reveals its rows inside the surface: hidden to start with, shown at once with isAnimated off", () => {
    const { unmount } = render(<List label="Recent" items={ITEMS} />);
    const reveal = screen.getByRole("list", { name: "Recent" }).closest('[data-slot="reveal"]');
    expect(reveal).toBeTruthy();
    expect((reveal as HTMLElement).style.opacity).toBe("0");
    unmount();
    render(<List label="Recent" items={ITEMS} isAnimated={false} />);
    const still = screen.getByRole("list", { name: "Recent" }).closest('[data-slot="reveal"]');
    expect((still as HTMLElement).style.opacity).not.toBe("0");
  });

  it("draws the title, the description, the start icon, the end content and the chevron of a row", () => {
    render(
      <List
        label="Recent"
        items={[
          {
            id: "a",
            title: "Alpha",
            description: "First",
            startIcon: "user",
            endContent: <b data-testid="end">42</b>,
            hasChevron: true,
          },
        ]}
      />,
    );
    const row = screen.getByRole("listitem");
    expect(within(row).getByText("Alpha")).toBeTruthy();
    expect(within(row).getByText("First")).toBeTruthy();
    expect(within(row).getByTestId("end").textContent).toBe("42");
    // The start icon and the chevron: two decorative SVGs.
    expect(row.querySelectorAll("svg")).toHaveLength(2);
    expect(row.querySelector("svg[aria-hidden='true']")).toBeTruthy();
  });

  it("makes a pressable row a button that runs onPress, and leaves a plain row as content", () => {
    const onPress = vi.fn();
    render(
      <List
        label="Recent"
        items={[
          { id: "a", title: "Alpha", onPress },
          { id: "b", title: "Bravo" },
        ]}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
    press(screen.getByRole("button", { name: /Alpha/ }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("names a button by `label` when the title is not text", () => {
    render(
      <List
        label="Recent"
        items={[{ id: "a", title: <i>★</i>, label: "Favourites", onPress: () => undefined }]}
      />,
    );
    expect(screen.getByRole("button", { name: "Favourites" })).toBeTruthy();
  });

  it("refuses the press of a disabled row", () => {
    const onPress = vi.fn();
    render(
      <List label="Recent" items={[{ id: "a", title: "Alpha", onPress, isDisabled: true }]} />,
    );
    const button = screen.getByRole("button", { name: /Alpha/ });
    expect(button.hasAttribute("disabled") || button.getAttribute("aria-disabled") === "true").toBe(
      true,
    );
    press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("never dims a plain row: it has no press to refuse", () => {
    render(<List label="Recent" items={[{ id: "a", title: "Alpha", isDisabled: true }]} />);
    expect(screen.getByRole("listitem").firstElementChild?.classList.contains("opacity-50")).toBe(
      false,
    );
  });

  it.each(SurfaceVariant)("draws the %s surface", (variant) => {
    const { container } = render(<List label="Recent" items={ITEMS} variant={variant} />);
    expect(container.querySelector(`.surface--${variant}`)).toBeTruthy();
  });

  it("becomes a list box of options once it selects", () => {
    render(<List label="Recent" items={ITEMS} selectionMode="single" />);
    const box = screen.getByRole("listbox", { name: "Recent" });
    expect(within(box).getAllByRole("option")).toHaveLength(3);
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.getByRole("option", { name: /Alpha/ })).toBeTruthy();
  });

  it("selects one row and reports its id, then clears it when it is pressed again", () => {
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        items={ITEMS}
        selectionMode="single"
        onSelectionChange={onSelectionChange}
      />,
    );
    press(screen.getByRole("option", { name: /Bravo/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["b"]);
    expect(screen.getByRole("option", { name: /Bravo/ }).getAttribute("aria-selected")).toBe(
      "true",
    );
    press(screen.getByRole("option", { name: /Alpha/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a"]);
    press(screen.getByRole("option", { name: /Alpha/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("reports several ids in the items' order, not the order of the presses", () => {
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        items={ITEMS}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      />,
    );
    press(screen.getByRole("option", { name: /Charlie/ }));
    press(screen.getByRole("option", { name: /Alpha/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["a", "c"]);
  });

  it("starts with defaultSelectedKeys and follows selectedKeys when controlled", () => {
    const { rerender } = render(
      <List label="Recent" items={ITEMS} selectionMode="multiple" defaultSelectedKeys={["b"]} />,
    );
    expect(selectedNames()).toEqual(["BravoSecond"]);

    const controlled = (keys: readonly string[]) => (
      <IconRegistryProvider registry={registry}>
        <List label="Recent" items={ITEMS} selectionMode="multiple" selectedKeys={keys} />
      </IconRegistryProvider>
    );
    rerender(controlled(["c"]));
    expect(selectedNames()).toEqual(["Charlie"]);
    // A press on a controlled list asks; it does not change what the parent holds.
    press(screen.getByRole("option", { name: /Alpha/ }));
    expect(selectedNames()).toEqual(["Charlie"]);
  });

  it("refuses a disabled row and never calls onPress while it selects", () => {
    const onPress = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <List
        label="Recent"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        items={[
          { id: "a", title: "Alpha", onPress },
          { id: "b", title: "Bravo", isDisabled: true },
        ]}
      />,
    );
    press(screen.getByRole("option", { name: /Bravo/ }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: /Bravo/ }).getAttribute("aria-disabled")).toBe(
      "true",
    );
    press(screen.getByRole("option", { name: /Alpha/ }));
    expect(onSelectionChange).toHaveBeenCalledWith(["a"]);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("shows the empty state only when there are no items and nothing loads", () => {
    const { rerender } = render(<List label="Recent" items={[]} emptyState={<p>Nothing yet</p>} />);
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
    rerender(
      <IconRegistryProvider registry={registry}>
        <List label="Recent" items={[]} emptyState={<p>Nothing yet</p>} isLoading />
      </IconRegistryProvider>,
    );
    expect(screen.queryByText("Nothing yet")).toBeNull();
    rerender(
      <IconRegistryProvider registry={registry}>
        <List label="Recent" items={ITEMS} emptyState={<p>Nothing yet</p>} />
      </IconRegistryProvider>,
    );
    expect(screen.queryByText("Nothing yet")).toBeNull();
  });

  it("is busy while loading and names one spinner, once", () => {
    const { container, rerender } = render(
      <List label="Recent" items={ITEMS} isLoading loadingLabel="Loading orders" />,
    );
    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByRole("status", { name: "Loading orders" })).toHaveLength(1);
    // The rows stay while the next page loads.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    rerender(
      <IconRegistryProvider registry={registry}>
        <List label="Recent" items={ITEMS} loadingLabel="Loading orders" />
      </IconRegistryProvider>,
    );
    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("false");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("calls onLoadMore when the end shows, only while hasMore and not loading", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <List label="Recent" items={ITEMS} hasMore onLoadMore={onLoadMore} />,
    );
    expect(observers).toHaveLength(1);
    observers[0]?.fire();
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    const again = (props: Partial<ListProps>) =>
      rerender(
        <IconRegistryProvider registry={registry}>
          <List label="Recent" items={ITEMS} onLoadMore={onLoadMore} {...props} />
        </IconRegistryProvider>,
      );
    const watching = () => observers.filter((observer) => !observer.disconnected).length;
    again({ hasMore: true, isLoading: true });
    expect(watching()).toBe(0);
    again({ hasMore: false });
    expect(watching()).toBe(0);
    again({ hasMore: true });
    expect(watching()).toBe(1);
  });

  it("watches the end afresh when the rows change, so a short page asks for the next", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <List label="Recent" items={ITEMS.slice(0, 1)} hasMore onLoadMore={onLoadMore} />,
    );
    rerender(
      <IconRegistryProvider registry={registry}>
        <List label="Recent" items={ITEMS} hasMore onLoadMore={onLoadMore} />
      </IconRegistryProvider>,
    );
    expect(observers[0]?.disconnected).toBe(true);
    expect(observers.filter((observer) => !observer.disconnected)).toHaveLength(1);
  });

  it("passes the root's props and ref through", () => {
    const ref = createRef<HTMLDivElement>();
    render(<List ref={ref} label="Recent" items={ITEMS} data-testid="root" className="mine" />);
    const root = screen.getByTestId("root");
    expect(ref.current).toBe(root);
    expect(root.classList.contains("mine")).toBe(true);
  });

  it("types: extends the contract and refuses the raw names", () => {
    expectTypeOf<ListProps>().toExtend<ListContractProps>();
    // @ts-expect-error a selection is `selectedKeys`, a list of ids; React Aria's `selectedKey` is not a prop
    render(<List label="x" items={ITEMS} selectedKey="a" />);
    // @ts-expect-error the end reached is `onLoadMore` on both runtimes
    render(<List label="x" items={ITEMS} onEndReached={() => undefined} />);
    // @ts-expect-error a list needs its accessible name
    render(<List items={ITEMS} />);
    // A hyphenated JSX attribute is never checked by the compiler, so the type itself is asked.
    expectTypeOf<ListProps>().not.toHaveProperty("aria-busy");
  });
});
