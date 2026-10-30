/**
 * Stackra file contract:
 * Purpose: proves the web Tabs' wave C extensions: a closable tab closes from its close mark without being selected
 *          and from Delete, which its description says; with `overflow="menu"` the tabs that do not fit leave the tab list
 *          for a "More" menu, the selected tab always stays, and picking a tab from the menu selects it.
 * Boundary: jsdom with real HeroUI and React Aria; jsdom has no layout, so tab and row widths are stubbed.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Tabs } from "#react/tabs/tabs";

const ITEMS = [
  { id: "orders", label: "Orders", content: "All orders", isClosable: true },
  { id: "returns", label: "Returns", content: "Returns", isClosable: true },
  { id: "drafts", label: "Drafts", content: "Drafts" },
  { id: "archive", label: "Archive", content: "Archive" },
] as const;

/** Watches nothing: jsdom has no layout. */
class ResizeObserverStandIn {
  observe() {}

  unobserve() {}

  disconnect() {}
}

const tabNames = () => screen.getAllByRole("tab").map((each) => each.textContent);

describe("Tabs (web): closable and overflow", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStandIn);
    Object.defineProperty(Element.prototype, "getAnimations", {
      value: () => [],
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(Element.prototype, "getAnimations");
    Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
    Reflect.deleteProperty(HTMLElement.prototype, "clientWidth");
  });

  it("closes a tab from its close mark without selecting it, and from Delete", () => {
    const closed: string[] = [];
    const { container } = render(
      <Tabs items={ITEMS} label="Views" onClose={(id) => closed.push(id)} />,
    );
    const marks = container.querySelectorAll<HTMLElement>('[data-slot="tab-close"]');
    expect(marks).toHaveLength(2);
    expect(marks[1]?.getAttribute("aria-hidden")).toBe("true");
    act(() => marks[1]?.click());
    expect(closed).toEqual(["returns"]);
    expect(screen.getByRole("tab", { name: "Orders" }).getAttribute("aria-selected")).toBe("true");
    const orders = screen.getByRole("tab", { name: "Orders" });
    const described = orders.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(described)?.textContent).toBe("Close Orders: Delete");
    fireEvent.keyDown(orders, { key: "Delete" });
    expect(closed).toEqual(["returns", "orders"]);
    expect(screen.getByRole("tab", { name: "Drafts" }).hasAttribute("aria-describedby")).toBe(
      false,
    );
  });

  it("moves the tabs that do not fit into a More menu, keeping the selected one", () => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset["tabId"] ? 100 : 60;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      get: () => 300,
    });
    const picked: string[][] = [];
    render(
      <Tabs
        items={ITEMS}
        label="Views"
        overflow="menu"
        defaultSelectedKeys={["archive"]}
        onSelectionChange={(keys) => picked.push([...keys])}
      />,
    );
    expect(tabNames()).toEqual(["Orders", "Archive"]);
    const more = screen.getByRole("button", { name: /More/u });
    act(() => more.click());
    const option = screen.getByRole("menuitem", { name: "Drafts" });
    act(() => option.click());
    expect(picked.at(-1)).toEqual(["drafts"]);
    expect(tabNames()).toContain("Drafts");
    expect(screen.getByRole("tab", { name: "Drafts" }).getAttribute("aria-selected")).toBe("true");
  });

  it("keeps every tab in the row when they fit", () => {
    render(<Tabs items={ITEMS} label="Views" overflow="menu" />);
    expect(tabNames()).toHaveLength(4);
  });
});
