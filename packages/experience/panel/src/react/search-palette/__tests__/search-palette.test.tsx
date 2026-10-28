/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchPalette`: nothing is searched until typing settles, each source's query runs with the
 *          phrase and limit, hits draw with their model's label, picking a hit hands it over and closes, one empty
 *          state shows when every model found none, and a failed model shows its failure with a retry.
 * Boundary: unit tier, jsdom with fake timers; `useQuery` is a spy answering per query key, the web kit is DOM
 *           stand-ins and translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0221 (decision 4, settled 2026-10-29).
 */
// @vitest-environment jsdom
import type { QueryRef } from "@stackra/clients";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { SearchPalette } from "#react/search-palette/search-palette";
import type { SearchPaletteSource } from "#react/search-palette/search-palette-source.type";

const query = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("@stackra/clients/react", () => ({ useQuery: query.useQuery }));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
}));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  type Props = Record<string, unknown> & { readonly children?: unknown };
  const Modal = Object.assign(
    (props: Props) =>
      props.isOpen === true
        ? createElement("div", { role: "dialog" }, props.children as never)
        : null,
    { Body: (props: Props) => createElement("div", null, props.children as never) },
  );
  return {
    Modal,
    SearchField: (props: Props) =>
      createElement("input", {
        "aria-label": props.label,
        value: props.value,
        onChange: (event: { target: { value: string } }) =>
          (props.onChange as (value: string) => void)(event.target.value),
      }),
    EmptyState: (props: Props) => createElement("p", null, props.title as never),
    ErrorState: (props: Props) => {
      const retry = props.retry as { label: string; onPress: () => void };
      return createElement(
        "div",
        null,
        props.title as never,
        createElement("button", { type: "button", onClick: retry.onPress }, retry.label),
      );
    },
    List: (props: Props) =>
      createElement(
        "ul",
        { "aria-label": props.label },
        (
          props.items as {
            id: string;
            title: string;
            description?: string;
            endContent?: string;
            onPress: () => void;
          }[]
        ).map((item) =>
          createElement(
            "li",
            { key: item.id },
            createElement(
              "button",
              { type: "button", onClick: item.onPress },
              [item.title, item.description, item.endContent].filter(Boolean).join(" | "),
            ),
          ),
        ),
      ),
  };
});

/** A stand-in for a generated search query ref. */
function refOf(key: string): QueryRef {
  return { key } as unknown as QueryRef;
}

const products: SearchPaletteSource = {
  query: refOf("catalog.product.search@1"),
  label: "Products",
};
const customers: SearchPaletteSource = {
  query: refOf("crm.customer.search@1"),
  label: "Customers",
};

/** Answers each query key with `answers[key]`, or no hits. */
function answer(answers: Record<string, object>) {
  query.useQuery.mockImplementation((ref: QueryRef) => ({
    data: { hits: [] },
    error: null,
    isPending: false,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
    ...answers[ref.key],
  }));
}

/** Types `text` and lets the phrase settle. */
function type(text: string) {
  fireEvent.change(screen.getByLabelText("panel::search_palette.label"), {
    target: { value: text },
  });
  act(() => {
    vi.advanceTimersByTime(200);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  query.useQuery.mockReset();
});

describe("SearchPalette", () => {
  it("searches nothing until typing settles, then every source with the phrase and limit", () => {
    answer({});
    render(
      <SearchPalette
        sources={[products, customers]}
        isOpen
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        limit={3}
      />,
    );
    fireEvent.change(screen.getByLabelText("panel::search_palette.label"), {
      target: { value: "  lin " },
    });
    expect(query.useQuery).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(query.useQuery).toHaveBeenCalledWith(
      products.query,
      { q: "lin", limit: 3 },
      { keepPreviousData: true },
    );
    expect(query.useQuery).toHaveBeenCalledWith(
      customers.query,
      { q: "lin", limit: 3 },
      { keepPreviousData: true },
    );
  });

  it("draws hits with their model's label and hands the picked one over before closing", () => {
    answer({
      "catalog.product.search@1": {
        data: { hits: [{ id: "prd_1", title: "Linen shirt", snippet: "…linen shirt…" }] },
      },
    });
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <SearchPalette
        sources={[products, customers]}
        isOpen
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    );
    type("linen");
    fireEvent.click(screen.getByText("Linen shirt | …linen shirt… | Products"));
    expect(onSelect).toHaveBeenCalledWith(products, {
      id: "prd_1",
      title: "Linen shirt",
      snippet: "…linen shirt…",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByLabelText("Customers")).toBeNull();
    expect(screen.queryByText("panel::search_palette.empty")).toBeNull();
  });

  it("shows one empty state when every model found none", () => {
    answer({});
    render(
      <SearchPalette
        sources={[products, customers]}
        isOpen
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    type("zzz");
    expect(screen.getAllByText("panel::search_palette.empty")).toHaveLength(1);
  });

  it("shows a failed model with a retry", () => {
    const refetch = vi.fn();
    answer({
      "crm.customer.search@1": { data: undefined, error: new Error("down"), refetch },
    });
    render(
      <SearchPalette sources={[customers]} isOpen onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );
    type("ali");
    expect(
      screen.getByText('panel::search_palette.failed {"source":"Customers"}', { exact: false }),
    ).toBeTruthy();
    fireEvent.click(screen.getByText("panel::widgets.retry"));
    expect(refetch).toHaveBeenCalled();
  });

  it("draws nothing while closed", () => {
    answer({});
    render(
      <SearchPalette
        sources={[products]}
        isOpen={false}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
