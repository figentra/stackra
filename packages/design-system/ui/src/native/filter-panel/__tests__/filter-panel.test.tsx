/**
 * Stackra file contract:
 * Purpose: proves the native FilterPanel draws one clearable chip per applied filter, counts them on its Filters
 *          button, opens a drawer of facets whose choice options carry their counts, applies a saved view's query and
 *          speaks the result count politely.
 * Boundary: jsdom with React Native, Reanimated and the house parts replaced by stand-ins that record their props.
 * Runtime: react-native
 * Governing contract: ADR 0022 (test placement); design-system gap inventory (2026-10-28) row 9.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { FilterPanel } from "#native/filter-panel/filter-panel";

const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

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
    useReducedMotion: () => false,
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

vi.mock("#native/menu/menu", async () => {
  const { createElement } = await import("react");
  return {
    Menu: (props: Record<string, unknown>) => {
      received.props["menu"] = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/tabs/tabs", async () => {
  const { createElement } = await import("react");
  return {
    Tabs: (props: Record<string, unknown>) => {
      received.props["tabs"] = props;
      const items = props["items"] as { id: string; label: string }[];
      const onChange = props["onSelectionChange"] as (keys: string[]) => void;
      return createElement(
        "div",
        null,
        items.map((item) =>
          createElement(
            "button",
            { key: item.id, type: "button", role: "tab", onClick: () => onChange([item.id]) },
            item.label,
          ),
        ),
      );
    },
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

const FILTERS: readonly FilterDefinition[] = [
  {
    id: "status",
    label: "Status",
    kind: "select",
    options: [
      { id: "open", label: "Open" },
      { id: "closed", label: "Closed" },
    ],
  },
];

const QUERY: ResourceQuery = { search: "", filterValues: { status: "open" }, sort: null };

describe("FilterPanel (native)", () => {
  it("draws a clearable chip per applied filter and counts them on the Filters button", () => {
    const onQueryChange = vi.fn();
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={onQueryChange}
        filters={FILTERS}
        label="Filter tickets"
      />,
    );
    expect(screen.getByText("Status: Open")).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Remove filter Status" }).click());
    expect(onQueryChange).toHaveBeenLastCalledWith({ ...QUERY, filterValues: {} });
    expect(screen.getByRole("button", { name: "Filters (1)" })).toBeTruthy();
  });

  it("opens a drawer of facets whose options carry their counts", () => {
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={vi.fn()}
        filters={FILTERS}
        label="Filter tickets"
        counts={{ status: { open: 8, closed: 21 } }}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => screen.getByRole("button", { name: "Filters (1)" }).click());
    expect(screen.getByRole("dialog", { name: "Filter tickets" })).toBeTruthy();
    expect(screen.getByText("Closed (21)")).toBeTruthy();
  });

  it("applies a saved view's query and speaks the result count politely", () => {
    const onQueryChange = vi.fn();
    const closed: ResourceQuery = { search: "", filterValues: { status: "closed" }, sort: null };
    render(
      <FilterPanel
        query={QUERY}
        onQueryChange={onQueryChange}
        filters={FILTERS}
        label="Filter tickets"
        resultCount={1}
        views={[
          { id: "open", label: "Open", query: QUERY },
          { id: "closed", label: "Closed", query: closed },
        ]}
      />,
    );
    act(() => screen.getByRole("tab", { name: "Closed" }).click());
    expect(onQueryChange).toHaveBeenLastCalledWith(closed);
    expect(screen.getByText("1 result").closest("[aria-live]")?.getAttribute("aria-live")).toBe(
      "polite",
    );
  });
});
