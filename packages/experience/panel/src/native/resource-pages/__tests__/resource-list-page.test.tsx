/**
 * Stackra file contract:
 * Purpose: unit tests of the native `ResourceListPage`: the title, the list query read with the page size, the row's own
 *          keys as columns without a tree, a row's View link and the header's Create link pushing the resource's pages
 *          by name, the table named by the title, the error state's retry, and the same page under `dir="rtl"` with no
 *          physical side classes.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `react-native` and `@stackra/ui/native` are DOM
 *           stand-ins (the table draws the engine's rows and columns); `useQuery`, the action runner and navigation are
 *           spies; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 to 4); ADR 0164 (native parity).
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import type { StandInProps as Props } from "#core/__tests__/stand-in-props.fixture";
import { resource } from "#core/functions/resource.function";
import { ResourceListPage } from "#native/resource-pages/resource-list-page";

const spies = vi.hoisted(() => ({
  useQuery: vi.fn(),
  run: vi.fn(),
  to: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@stackra/clients/native", () => ({ useQuery: spies.useQuery }));
vi.mock("#native/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/navigation/native", () => ({
  useNavigate: () => ({ to: spies.to, replace: vi.fn(), back: vi.fn() }),
}));
vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: { readonly children?: ReactNode; readonly className?: string }) =>
      createElement("div", { className: props.className }, props.children),
  };
});

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Props) => createElement("span", null, props.children),
    Button: (props: Props) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
    EmptyState: (props: Props) => createElement("p", null, props.title, props.actions),
    PullToRefresh: (props: Props) => createElement("div", null, props.children),
    FilterBar: (props: Props) =>
      createElement("input", { type: "search", "aria-label": props.searchLabel }),
    PageHeader: (props: Props) =>
      createElement(
        "header",
        null,
        createElement("h1", null, props.title),
        props.actions.map((action: Props) =>
          createElement(
            "button",
            { type: "button", key: action.id, onClick: () => action.onPress?.() },
            action.label,
          ),
        ),
      ),
    useCollection: (options: Props) => ({
      views: options.views ?? [],
      state: { selection: [] },
      rows: options.items,
      columns: options.columns,
    }),
    DataTable: (props: Props) =>
      props.error === undefined
        ? createElement(
            "div",
            null,
            props.filterBar,
            createElement(
              "table",
              { "aria-label": props.label },
              createElement(
                "tbody",
                null,
                props.collection.rows.map((row: Props) =>
                  createElement(
                    "tr",
                    { key: row.id },
                    props.collection.columns.map((column: Props) =>
                      createElement("td", { key: column.id }, props.renderCell(row, column)),
                    ),
                    createElement(
                      "td",
                      null,
                      props
                        .rowActions(row)
                        .map((action: Props) =>
                          createElement(
                            "button",
                            { type: "button", key: action.id, onClick: () => action.onPress?.() },
                            action.label,
                          ),
                        ),
                    ),
                  ),
                ),
              ),
            ),
          )
        : createElement("button", { type: "button", onClick: props.onRetry }, props.retryLabel),
  };
});

const ListProductsQuery = queryRef("shop.product.list@1", {
  input: z.object({ limit: z.number().int().optional() }),
  output: z.object({ items: z.array(z.object({ id: z.string() })) }),
});
const GetProductQuery = queryRef("shop.product.get@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({ id: z.string() }),
});
const CreateProductAction = actionRef("shop.product.create@1", {
  input: z.object({ name: z.string() }),
  output: z.object({ id: z.string() }),
});

const Products = resource("shop.product", {
  base: "/shop/products",
  list: ListProductsQuery,
  view: GetProductQuery,
  create: CreateProductAction,
});

/** The list query's answer. */
const answer = (overrides: object = {}) => ({
  data: { items: [{ id: "prd_1", name: "Mug" }], hasMore: false },
  error: null,
  isPending: false,
  isFetching: false,
  refetch: spies.refetch,
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("native ResourceListPage", () => {
  it("draws the title and the list query's rows under the row's own keys", () => {
    spies.useQuery.mockReturnValue(answer());
    render(<ResourceListPage resource={Products} />);
    expect(screen.getByRole("heading", { name: "shop::resources.product.title" })).toBeDefined();
    expect(spies.useQuery.mock.calls[0]?.[0]).toBe(ListProductsQuery);
    const table = screen.getByRole("table", { name: "shop::resources.product.title" });
    expect(table.textContent).toContain("Mug");
    expect(screen.getByRole("searchbox", { name: "panel::resources.search" })).toBeDefined();
  });

  it("pushes the View page of a row and the Create page from the header", () => {
    spies.useQuery.mockReturnValue(answer());
    render(<ResourceListPage resource={Products} />);
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.view" }));
    expect(spies.to).toHaveBeenCalledWith(Products.view, { id: "prd_1" });
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.create" }));
    expect(spies.to).toHaveBeenCalledWith(Products.create, {});
  });

  it("retries a failed read", () => {
    spies.useQuery.mockReturnValue(answer({ data: undefined, error: new Error("down") }));
    render(<ResourceListPage resource={Products} />);
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.retry" }));
    expect(spies.refetch).toHaveBeenCalled();
  });

  it("draws the same page right to left, on logical sides only", () => {
    spies.useQuery.mockReturnValue(answer());
    const { container } = render(
      <div dir="rtl">
        <ResourceListPage resource={Products} />
      </div>,
    );
    expect(screen.getByRole("table").textContent).toContain("Mug");
    expect(container.innerHTML).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/);
  });

  it("refuses a resource without a list query", () => {
    spies.useQuery.mockReturnValue(answer());
    const Bare = resource("shop.bare", { base: "/shop/bare" });
    expect(() => render(<ResourceListPage resource={Bare} />)).toThrow(TypeError);
  });
});
