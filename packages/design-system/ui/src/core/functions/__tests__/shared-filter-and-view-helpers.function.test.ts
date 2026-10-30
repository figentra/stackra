/**
 * Stackra file contract:
 * Purpose: proves the pure helpers the web and native FilterEditor and SavedViews share: `choiceOptionsOf` (value,
 *          label, and description and disabled only when given), `listedOptionIdsOf` (the options' order, unknown ids
 *          dropped), `booleanFilterChoicesOf` (true then false, the filter's own words or the translated yes and no)
 *          and `savedViewsOf` (active view, chips with counts, picked facets, and the queries a pick makes).
 * Boundary: pure functions; the translator is a stand-in that returns the key.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { booleanFilterChoicesOf } from "#core/functions/boolean-filter-choices-of.function";
import { choiceOptionsOf } from "#core/functions/choice-options-of.function";
import { listedOptionIdsOf } from "#core/functions/listed-option-ids-of.function";
import { savedViewsOf } from "#core/functions/saved-views-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/** A translator that says which key it was asked for. */
const t = ((key: string) => key) as CatalogueText;

const OPTIONS = [
  { id: "open", label: "Open", description: "Not closed yet" },
  { id: "closed", label: "Closed", isDisabled: true },
];

describe("choiceOptionsOf", () => {
  it("keeps the value, the label and only the extras an item has", () => {
    expect(choiceOptionsOf(OPTIONS)).toEqual([
      { value: "open", label: "Open", description: "Not closed yet" },
      { value: "closed", label: "Closed", isDisabled: true },
    ]);
  });
});

describe("listedOptionIdsOf", () => {
  it("reports the chosen ids in the options' order and drops unknown ones", () => {
    expect(listedOptionIdsOf(OPTIONS, ["closed", "gone", "open"])).toEqual(["open", "closed"]);
    expect(listedOptionIdsOf(OPTIONS, [])).toEqual([]);
  });
});

describe("booleanFilterChoicesOf", () => {
  it("offers true then false with the translated yes and no", () => {
    const definition = { id: "paid", label: "Paid", kind: "boolean" } as FilterDefinition;
    const choices = booleanFilterChoicesOf(definition, "en", t);
    expect(choices.map((choice) => choice.value)).toEqual(["true", "false"]);
    expect(choices[0]?.label).toContain("yes");
    expect(choices[1]?.label).toContain("no");
  });

  it("uses the filter's own words", () => {
    const definition = {
      id: "paid",
      label: "Paid",
      kind: "boolean",
      trueLabel: "Settled",
      falseLabel: "Due",
    } as FilterDefinition;
    expect(booleanFilterChoicesOf(definition, "en", t).map((choice) => choice.label)).toEqual([
      "Settled",
      "Due",
    ]);
  });
});

describe("savedViewsOf", () => {
  const base: ResourceQuery = { search: "", filterValues: {}, sort: null };
  const open: ResourceQuery = { ...base, filterValues: { status: ["open"] } };
  const views = [
    { id: "all", label: "All", query: base },
    { id: "open", label: "Open", query: open },
  ];
  const facets = [
    { id: "open", label: "Open", count: 1200 },
    { id: "closed", label: "Closed" },
  ];

  it("marks the matching view, counts the facets and lists the picked ones", () => {
    const state = savedViewsOf({
      views,
      query: open,
      onQueryChange: vi.fn(),
      facetFilterId: "status",
      facets,
    });
    expect(state.activeId).toBe("open");
    expect(state.viewItems).toEqual([
      { id: "all", label: "All" },
      { id: "open", label: "Open" },
    ]);
    expect(state.facetItems[0]?.label).toMatch(/^Open \(1.?200\)$/);
    expect(state.facetItems[1]?.label).toBe("Closed");
    expect(state.picked).toEqual(["open"]);
  });

  it("changes the query to a view's or to the picked facets", () => {
    const onQueryChange = vi.fn();
    const state = savedViewsOf({ views, query: base, onQueryChange, facetFilterId: "status" });
    expect(state.facetItems).toEqual([]);
    expect(state.picked).toEqual([]);
    state.pickView(["open"]);
    expect(onQueryChange).toHaveBeenLastCalledWith(open);
    state.pickView(["missing"]);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    state.pickFacets(["closed"]);
    expect(onQueryChange).toHaveBeenLastCalledWith({
      ...base,
      filterValues: { status: ["closed"] },
    });
  });

  it("reports no facet pick without a facet filter", () => {
    const onQueryChange = vi.fn();
    const state = savedViewsOf({ views, query: base, onQueryChange });
    state.pickFacets(["open"]);
    expect(onQueryChange).not.toHaveBeenCalled();
    expect(state.activeId).toBe("all");
  });
});
