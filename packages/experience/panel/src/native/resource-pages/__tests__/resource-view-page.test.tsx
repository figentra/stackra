/**
 * Stackra file contract:
 * Purpose: unit tests of the native `ResourceViewPage`: the get query read with the record id under its input key, the
 *          record's own keys as entries without a tree, the header's Edit link pushing the Edit page by name, the
 *          skeleton while pending, the error state's retry, a missing id refused, and the same page under `dir="rtl"`.
 * Boundary: unit tier, jsdom. `react-native` and `@stackra/ui/native` are DOM stand-ins; `useQuery`, the action runner
 *           and navigation are spies; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 3 and 4); ADR 0164 (native parity).
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { resource } from "#core/functions/resource.function";
import { ResourceViewPage } from "#native/resource-pages/resource-view-page";

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
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  return {
    Text: (props: Props) => createElement("span", null, props.children),
    PageSkeleton: (props: Props) =>
      createElement("p", { role: "status", "aria-label": props.loadingLabel }),
    ErrorState: (props: Props) =>
      createElement(
        "div",
        { role: "alert" },
        props.title,
        createElement(
          "button",
          { type: "button", onClick: props.retry.onPress },
          props.retry.label,
        ),
      ),
    PullToRefresh: (props: Props) => createElement("div", null, props.children),
    Section: (props: Props) => createElement("section", null, props.title, props.children),
    Table: () => null,
    PropertyList: (props: Props) =>
      createElement(
        "dl",
        null,
        props.items.map((item: Props) =>
          createElement(
            "div",
            { key: item.id },
            createElement("dt", null, item.label),
            createElement("dd", null, item.value),
          ),
        ),
      ),
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
  };
});

const GetProductQuery = queryRef("shop.product.get@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({ id: z.string() }),
});
const UpdateProductAction = actionRef("shop.product.update@1", {
  input: z.object({ productId: z.string(), name: z.string() }),
  output: z.object({}),
});

const Products = resource("shop.product", {
  base: "/shop/products",
  view: GetProductQuery,
  update: UpdateProductAction,
});

/** The get query's answer. */
const answer = (overrides: object = {}) => ({
  data: { id: "prd_1", name: "Mug" },
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

describe("native ResourceViewPage", () => {
  it("reads the record under its input key and draws its own keys", () => {
    spies.useQuery.mockReturnValue(answer());
    render(<ResourceViewPage resource={Products} id="prd_1" />);
    expect(spies.useQuery).toHaveBeenCalledWith(GetProductQuery, { productId: "prd_1" });
    expect(screen.getByRole("heading", { name: "shop::resources.product.title" })).toBeDefined();
    expect(screen.getByText("shop::resources.product.entries.name")).toBeDefined();
    expect(screen.getByText("Mug")).toBeDefined();
  });

  it("pushes the Edit page of the record", () => {
    spies.useQuery.mockReturnValue(answer());
    render(<ResourceViewPage resource={Products} id="prd_1" />);
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.edit" }));
    expect(spies.to).toHaveBeenCalledWith(Products.edit, { id: "prd_1" });
  });

  it("shows the skeleton while pending and retries a failed read", () => {
    spies.useQuery.mockReturnValue(answer({ data: undefined, isPending: true }));
    const { unmount } = render(<ResourceViewPage resource={Products} id="prd_1" />);
    expect(screen.getByRole("status", { name: "shop::resources.product.title" })).toBeDefined();
    unmount();
    spies.useQuery.mockReturnValue(answer({ data: undefined, error: new Error("down") }));
    render(<ResourceViewPage resource={Products} id="prd_1" />);
    expect(screen.getByRole("alert").textContent).toContain("panel::resources.failed");
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.retry" }));
    expect(spies.refetch).toHaveBeenCalled();
  });

  it("refuses to draw without a record id", () => {
    spies.useQuery.mockReturnValue(answer());
    expect(() => render(<ResourceViewPage resource={Products} />)).toThrow(TypeError);
  });

  it("draws the same record right to left", () => {
    spies.useQuery.mockReturnValue(answer());
    render(
      <div dir="rtl">
        <ResourceViewPage resource={Products} id="prd_1" />
      </div>,
    );
    expect(screen.getByText("Mug")).toBeDefined();
  });
});
