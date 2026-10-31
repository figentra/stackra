/**
 * Stackra file contract:
 * Purpose: proves the native FilterPanel on a `useCollection` engine draws one clearable chip per applied filter,
 *          counts them on its Filters button, opens a drawer of facets (one per filterable column) whose choice options
 *          carry their counts, writes a facet's change as one condition of the engine's filter, clears every filter,
 *          and speaks the result count (the engine's by default) politely.
 * Boundary: jsdom with React Native, Reanimated and the house parts replaced by stand-ins that record their props.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); ADR 0505 (one filter model); design-system gap inventory
 *          (2026-10-28) row 9.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import { FilterPanel } from "#native/filter-panel/filter-panel";
import type { FilterPanelProps } from "#native/filter-panel/filter-panel.props";
import { useCollection } from "#react/hooks/use-collection";

const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  isReduced: false,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  const box = (props: Record<string, unknown>) =>
    createElement(
      "div",
      {
        "aria-label": props["accessibilityLabel"] as string | undefined,
        "aria-live": props["accessibilityLiveRegion"] as "polite" | undefined,
      },
      props["children"] as ReactNode,
    );
  return { View: box, ScrollView: box };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain: object = new Proxy(() => chain, { get: () => chain, apply: () => chain });
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as ReactNode),
    },
    FadeIn: chain,
    FadeOut: chain,
    LinearTransition: chain,
    SlideInDown: chain,
    useReducedMotion: () => received.isReduced,
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/chip/chip", async () => {
  const { createElement } = await import("react");
  return {
    Chip: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});

vi.mock("#native/close-button/close-button", async () => {
  const { createElement } = await import("react");
  return {
    CloseButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        onClick: props["onPress"] as () => void,
      }),
  };
});

vi.mock("#native/drawer/drawer", async () => {
  const { createElement } = await import("react");
  const part = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const Drawer = Object.assign(
    (props: Record<string, unknown>) =>
      props["isOpen"]
        ? createElement(
            "div",
            { role: "dialog", "aria-label": props["label"] as string },
            props["children"] as ReactNode,
          )
        : null,
    { Header: part, Title: part, Body: part, Footer: part },
  );
  return { Drawer };
});

vi.mock("#native/filter-bar/filter-editor", async () => {
  const { createElement } = await import("react");
  return {
    FilterEditor: (props: Record<string, unknown>) => {
      received.props["editor"] = props;
      const definition = props["definition"] as FilterDefinition;
      return createElement(
        "ul",
        { "aria-label": definition.label },
        "options" in definition
          ? definition.options.map((option) =>
              createElement("li", { key: option.id }, option.label),
            )
          : null,
      );
    },
  };
});

const COLUMNS: readonly CollectionColumn[] = [
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "open", label: "Open" },
      { id: "closed", label: "Closed" },
    ],
  },
];

/** The engine the harness last drew. */
const latest = { collection: undefined as CollectionController | undefined };

/** An engine over two tickets, open ones filtered, with the panel on it. */
function Harness(props: Partial<FilterPanelProps>): ReactNode {
  const collection = useCollection({
    columns: COLUMNS,
    items: [
      { id: "1", status: "open" },
      { id: "2", status: "closed" },
    ],
    initialState: {
      filter: {
        match: "all",
        conditions: [{ id: "filter:status", field: "status", operator: "in", value: ["open"] }],
      },
    },
  });
  useEffect(() => {
    latest.collection = collection;
  });
  return <FilterPanel collection={collection} label="Filter tickets" {...props} />;
}

describe("FilterPanel (native)", () => {
  it("draws a clearable chip per applied filter and counts them on the Filters button", () => {
    render(<Harness />);
    expect(screen.getByText("Status: Open")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Filters (1)" })).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Remove filter Status" }).click());
    expect(latest.collection?.state.filter.conditions).toEqual([]);
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
  });

  it("opens a drawer of facets whose options carry their counts", () => {
    render(<Harness counts={{ status: { open: 8, closed: 21 } }} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => screen.getByRole("button", { name: "Filters (1)" }).click());
    expect(screen.getByRole("dialog", { name: "Filter tickets" })).toBeTruthy();
    expect(screen.getByText("Closed (21)")).toBeTruthy();
  });

  it("speaks the engine's result count politely, or the one given", () => {
    const { rerender } = render(<Harness />);
    expect(screen.getByText("1 result").closest("[aria-live]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
    rerender(<Harness resultCount={9} />);
    expect(screen.getByText("9 results")).toBeTruthy();
  });

  it("clears every filter, edits a facet in the drawer and closes it with Done", () => {
    received.isReduced = true;
    render(<Harness className="x" />);
    act(() => screen.getByRole("button", { name: "Clear all" }).click());
    expect(latest.collection?.isFiltered).toBe(false);
    act(() => screen.getByRole("button", { name: "Filters" }).click());
    act(() =>
      (received.props["editor"]?.["onChange"] as ((value: unknown) => void) | undefined)?.([
        "closed",
      ]),
    );
    expect(latest.collection?.state.filter.conditions).toEqual([
      { id: "filter:status", field: "status", operator: "in", value: ["closed"] },
    ]);
    act(() => screen.getByRole("button", { name: "Done" }).click());
    expect(screen.queryByRole("dialog")).toBeNull();
    received.isReduced = false;
  });
});
