/**
 * Stackra file contract:
 * Purpose: proves the native SavedViews: the views are one single-choice tag row with the view matching the query
 *          chosen, choosing a view applies its query, the facet chips are a multi-choice row (counts in brackets) whose
 *          change writes the facet filter, and "Save view" shows only while no view matches.
 * Boundary: React Native does not render in vitest, so it and the house TagGroup and Button are recording stand-ins;
 *           what each is handed and what the row reports through onQueryChange is checked.
 * Runtime: node
 * Governing contract: ADR 0318; WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { SavedViews } from "#native/saved-views/saved-views";

const state = vi.hoisted(() => ({ groups: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": props["testID"] }, props["children"] as ReactNode),
  };
});
vi.mock("#native/tag-group/tag-group", () => ({
  TagGroup: (props: Record<string, unknown>) => {
    state.groups[props["selectionMode"] as string] = props;
    return null;
  },
}));
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const EMPTY: ResourceQuery = { search: "", filterValues: {}, sort: null };
const OPEN: ResourceQuery = { search: "", filterValues: { status: "open" }, sort: null };
const VIEWS = [
  { id: "all", label: "All", query: EMPTY },
  { id: "open", label: "Open", query: OPEN },
];
const group = (mode: string) => state.groups[mode] ?? {};

beforeEach(() => {
  state.groups = {};
});

describe("SavedViews (native)", () => {
  it("chooses the view matching the query and applies a chosen view", () => {
    const onQueryChange = vi.fn();
    render(
      <SavedViews
        label="Views"
        views={VIEWS}
        query={OPEN}
        onQueryChange={onQueryChange}
        testID="row"
      />,
    );
    expect(screen.getByTestId("row")).toBeTruthy();
    expect(group("single")).toMatchObject({
      label: "Views",
      items: [
        { id: "all", label: "All" },
        { id: "open", label: "Open" },
      ],
      value: ["open"],
    });
    act(() => (group("single")["onChange"] as (ids: string[]) => void)(["all"]));
    expect(onQueryChange).toHaveBeenCalledWith(EMPTY);
    act(() => (group("single")["onChange"] as (ids: string[]) => void)([]));
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(state.groups["multiple"]).toBeUndefined();
  });

  it("toggles facet chips into the facet filter and counts them", () => {
    const onQueryChange = vi.fn();
    const query: ResourceQuery = { ...EMPTY, filterValues: { tag: ["a"] } };
    render(
      <SavedViews
        label="Views"
        views={VIEWS}
        query={query}
        onQueryChange={onQueryChange}
        facetFilterId="tag"
        facetLabel="Tags"
        facets={[
          { id: "a", label: "Alpha", count: 1200 },
          { id: "b", label: "Beta" },
        ]}
      />,
    );
    expect(group("multiple")).toMatchObject({
      label: "Tags",
      value: ["a"],
      items: [
        { id: "a", label: `Alpha (${(1200).toLocaleString()})` },
        { id: "b", label: "Beta" },
      ],
    });
    act(() => (group("multiple")["onChange"] as (ids: string[]) => void)(["a", "b"]));
    expect(onQueryChange).toHaveBeenCalledWith({ ...query, filterValues: { tag: ["a", "b"] } });
  });

  it("offers to save a query no view matches, and picks no chip from a non-list value", () => {
    const onSaveView = vi.fn();
    const query: ResourceQuery = { ...EMPTY, search: "x", filterValues: { tag: "a" } };
    render(
      <SavedViews
        label="Views"
        views={VIEWS}
        query={query}
        onQueryChange={vi.fn()}
        onSaveView={onSaveView}
        facetFilterId="tag"
        facets={[{ id: "a", label: "Alpha" }]}
        className="wide"
      />,
    );
    expect(group("single")["value"]).toEqual([]);
    expect(group("multiple")["value"]).toEqual([]);
    fireEvent.click(screen.getByText("ui::data_table_tools.save_view"));
    expect(onSaveView).toHaveBeenCalled();
  });

  it("hides save while a view matches and skips an empty facet list", () => {
    render(
      <SavedViews
        label="Views"
        views={VIEWS}
        query={EMPTY}
        onQueryChange={vi.fn()}
        onSaveView={vi.fn()}
        facetFilterId="tag"
        facets={[]}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(state.groups["multiple"]).toBeUndefined();
  });
});
