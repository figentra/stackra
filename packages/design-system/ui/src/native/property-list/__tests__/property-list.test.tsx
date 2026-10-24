/**
 * Stackra file contract:
 * Purpose: proves the native PropertyList is a `list` View of `listitem` Views, draws each label as muted small Text,
 *          wraps a string or number value in Text and draws any other node as given, shows the empty value for a missing,
 *          empty or `false` value but not for `0`, gives a copy button only to a row with a name and text when `onCopy`
 *          is given, calls `onCopy` and announces the copied label on a press, ignores `columns`, merges the caller's
 *          class and passes View props through.
 * Boundary: React Native does not render in vitest, so react-native, the Text and the IconButton are replaced by
 *           recording stand-ins that render plain DOM; what reaches them is checked, not how they draw.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); ADR
 *          0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-131 sta-350:FR-133
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { PropertyListContractProps } from "#contracts/types/property-list-contract-props.type";
import type { PropertyListItem } from "#contracts/types/property-list-item.type";
import { PropertyList, type PropertyListProps } from "#native/property-list/property-list";

/** What the stand-ins were last handed, by name. */
const received = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  announce: vi.fn(),
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement(
        "div",
        { "data-role": props["role"] as string },
        props["children"] as ReactNode,
      );
    },
    AccessibilityInfo: { announceForAccessibility: received.announce },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement(
        "span",
        { "data-type": props["type"] as string, "data-tone": props["tone"] as string },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) => {
      received.buttons.push(props);
      return createElement("button", { type: "button" }, props["label"] as string);
    },
  };
});

const ITEMS: readonly PropertyListItem[] = [
  { id: "customer", label: "Customer", value: "Ada Lovelace" },
  { id: "order", label: "Order id", value: "ord_01H2", copyLabel: "Copy order id" },
  { id: "note", label: "Note", value: "" },
  { id: "count", label: "Items", value: 0 },
];

/** Presses the first copy button the way the real one calls its handler. */
const pressCopy = () => {
  const onPress = received.buttons[0]?.["onPress"];
  if (typeof onPress !== "function") throw new Error("no copy button was drawn");
  onPress();
};

describe("PropertyList (native)", () => {
  beforeEach(() => {
    received.views = [];
    received.buttons = [];
    received.announce.mockReset();
  });

  it("is a list of list items, one for each row, in order", () => {
    const { container } = render(<PropertyList items={ITEMS} />);
    expect(received.views[0]).toMatchObject({ role: "list" });
    expect(container.querySelectorAll('[data-role="listitem"]')).toHaveLength(4);
    expect(
      [...container.querySelectorAll('[data-type="small"]')].map((label) => label.textContent),
    ).toEqual(["Customer", "Order id", "Note", "Items"]);
  });

  it("draws each label as muted small text and a text value in the body style", () => {
    const { container } = render(
      <PropertyList items={[{ id: "a", label: "Customer", value: "Ada" }]} />,
    );
    const label = container.querySelector('[data-type="small"]');
    expect(label?.getAttribute("data-tone")).toBe("muted");
    expect(screen.getByText("Ada").getAttribute("data-tone")).toBeNull();
  });

  it("shows the empty value for a missing, empty or false value, and not for zero", () => {
    render(
      <PropertyList
        items={[
          { id: "a", label: "Missing" },
          { id: "b", label: "Empty", value: "" },
          { id: "c", label: "False", value: false },
          { id: "d", label: "Zero", value: 0 },
        ]}
        emptyValue="Not set"
      />,
    );
    expect(screen.getAllByText("Not set")).toHaveLength(3);
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("draws a value that is a node as given, without wrapping it in text", () => {
    render(
      <PropertyList items={[{ id: "a", label: "Owner", value: <i data-testid="node">Ada</i> }]} />,
    );
    expect(screen.getByTestId("node").parentElement?.getAttribute("data-type")).toBeNull();
  });

  it("gives no copy button without onCopy", () => {
    render(<PropertyList items={ITEMS} />);
    expect(received.buttons).toHaveLength(0);
  });

  it("gives a copy button only to a row with a name and text to copy", () => {
    render(
      <PropertyList
        onCopy={vi.fn()}
        items={[
          { id: "a", label: "Named", value: "x", copyLabel: "Copy named" },
          { id: "b", label: "Unnamed", value: "y" },
          { id: "c", label: "Textless", value: <b>z</b>, copyLabel: "Copy textless" },
        ]}
      />,
    );
    expect(received.buttons.map((button) => button["label"])).toEqual(["Copy named"]);
    expect(received.buttons[0]).toMatchObject({ icon: "copy", variant: "ghost", size: "sm" });
  });

  it("calls onCopy with the row and its text, and announces the copied label", () => {
    const onCopy = vi.fn();
    render(<PropertyList items={ITEMS} onCopy={onCopy} copiedLabel="Copied" />);
    pressCopy();
    expect(onCopy).toHaveBeenCalledExactlyOnceWith(ITEMS[1], "ord_01H2");
    expect(received.announce).toHaveBeenCalledExactlyOnceWith("Copied");
  });

  it("announces a default copied word without a copied label", () => {
    render(<PropertyList items={ITEMS} onCopy={vi.fn()} />);
    pressCopy();
    expect(received.announce).toHaveBeenCalledExactlyOnceWith("Copied");
  });

  it("reads no columns, merges the caller's class and passes View props through", () => {
    render(<PropertyList items={ITEMS} columns={2} className="mt-4" testID="details" />);
    expect(received.views[0]).toMatchObject({ className: "gap-4 mt-4", testID: "details" });
    expect(received.views[0]).not.toHaveProperty("columns");
  });

  it("types: extends the contract and takes no children", () => {
    expectTypeOf<PropertyListProps>().toExtend<PropertyListContractProps>();
    // @ts-expect-error the rows come from `items`, not from children
    void (<PropertyList items={ITEMS}>row</PropertyList>);
    // @ts-expect-error a list without items draws nothing
    void (<PropertyList />);
  });
});
