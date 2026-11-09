/**
 * Stackra file contract:
 * Purpose: unit tests of the native `ResourceFormPage`: Create draws the create action's own input keys as fields by
 *          their type, Save runs the action with the form's values and replaces the form with the new record's View
 *          page, a refusal keeps the form with the server's field errors, Edit reads the record first and starts the
 *          form from it with the id under its key, an Edit without an id or a resource without the action is refused,
 *          and the form draws under `dir="rtl"`.
 * Boundary: unit tier, jsdom. `react-native` and `@stackra/ui/native` are DOM stand-ins (the schema form submits the
 *           values a test sets); `useQuery`, the action runner and navigation are spies; translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (form keys; rule 3); ADR 0164 (native parity).
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import type { StandInProps as Props } from "#core/__tests__/stand-in-props.fixture";
import { resource } from "#core/functions/resource.function";
import { ResourceFormPage } from "#native/resource-pages/resource-form-page";
import { ActionRunStatus } from "#react/action-runner/action-run-status.enum";

const spies = vi.hoisted(() => ({
  useQuery: vi.fn(),
  run: vi.fn(),
  replace: vi.fn(),
  useSchemaForm: vi.fn(),
  values: {} as Record<string, unknown>,
}));

vi.mock("@stackra/clients/native", () => ({ useQuery: spies.useQuery }));
vi.mock("#native/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/navigation/native", () => ({
  useNavigate: () => ({ to: vi.fn(), replace: spies.replace, back: vi.fn() }),
}));
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  type ViewProps = { readonly children?: ReactNode; readonly className?: string };
  return {
    View: (props: ViewProps) =>
      createElement("div", { className: props.className }, props.children),
    ScrollView: (props: ViewProps) => createElement("main", null, props.children),
  };
});

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  const field = (kind: string) => (props: Props) =>
    createElement("label", { "data-kind": kind }, `${kind}:${props.name}`);
  return {
    useSchemaForm: (type: unknown, options: unknown) => {
      spies.useSchemaForm(type, options);
      return {
        formState: { isSubmitting: false },
        handleSubmit: (onValid: (values: unknown) => unknown) => async () => onValid(spies.values),
      };
    },
    Form: (props: Props) => createElement("form", null, props.children),
    Field: { Text: field("text"), Number: field("number") },
    Button: (props: Props) =>
      createElement("button", { type: "button", onClick: props.onPress }, props.children),
    PageHeader: (props: Props) =>
      createElement("header", null, createElement("h1", null, props.title), props.description),
    PageSkeleton: () => createElement("p", { role: "status" }),
    ErrorState: (props: Props) => createElement("p", { role: "alert" }, props.title),
  };
});

const GetProductQuery = queryRef("shop.product.get@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({ id: z.string() }),
});
const CreateProductAction = actionRef("shop.product.create@1", {
  input: z.object({ name: z.string(), stock: z.number().int() }),
  output: z.object({ id: z.string() }),
});
const UpdateProductAction = actionRef("shop.product.update@1", {
  input: z.object({ productId: z.string(), name: z.string() }),
  output: z.object({}),
});

const Products = resource("shop.product", {
  base: "/shop/products",
  view: GetProductQuery,
  create: CreateProductAction,
  update: UpdateProductAction,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.values = {};
});

describe("native ResourceFormPage", () => {
  it("draws the create action's input keys by their type", () => {
    render(<ResourceFormPage resource={Products} mode="create" />);
    expect(screen.getByRole("heading", { name: "shop::resources.product.title" })).toBeDefined();
    expect(screen.getByText("text:name")).toBeDefined();
    expect(screen.getByText("number:stock")).toBeDefined();
  });

  it("runs the action with the form's values and opens the new record", async () => {
    spies.values = { name: "Mug", stock: 3 };
    spies.run.mockResolvedValue({ status: ActionRunStatus.Done, data: { id: "prd_9" } });
    render(<ResourceFormPage resource={Products} mode="create" />);
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.save" }));
    await waitFor(() => expect(spies.replace).toHaveBeenCalledWith(Products.view, { id: "prd_9" }));
    expect(spies.run).toHaveBeenCalledWith(CreateProductAction, { name: "Mug", stock: 3 });
  });

  it("keeps the form with the server's field errors on a refusal", async () => {
    spies.run.mockResolvedValue({
      status: ActionRunStatus.Refused,
      error: { fieldErrors: { name: "taken" } },
    });
    render(<ResourceFormPage resource={Products} mode="create" />);
    fireEvent.click(screen.getByRole("button", { name: "panel::resources.save" }));
    await waitFor(() =>
      expect(spies.useSchemaForm).toHaveBeenLastCalledWith(
        CreateProductAction,
        expect.objectContaining({ serverErrors: { name: "taken" } }),
      ),
    );
    expect(spies.replace).not.toHaveBeenCalled();
  });

  it("starts Edit from the record, the id under its input key", () => {
    spies.useQuery.mockReturnValue({
      data: { id: "prd_1", name: "Mug" },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceFormPage resource={Products} mode="edit" id="prd_1" />);
    expect(spies.useQuery).toHaveBeenCalledWith(GetProductQuery, { productId: "prd_1" });
    expect(spies.useSchemaForm).toHaveBeenCalledWith(
      UpdateProductAction,
      expect.objectContaining({
        defaultValues: { id: "prd_1", name: "Mug", productId: "prd_1" },
      }),
    );
    expect(screen.getByText("text:name")).toBeDefined();
    expect(screen.queryByText("text:productId")).toBeNull();
  });

  it("refuses Edit without an id and a resource without the action", () => {
    spies.useQuery.mockReturnValue({ data: undefined, error: null, isPending: true });
    expect(() => render(<ResourceFormPage resource={Products} mode="edit" />)).toThrow(TypeError);
    const ReadOnly = resource("shop.product", { base: "/shop/products", view: GetProductQuery });
    expect(() => render(<ResourceFormPage resource={ReadOnly} mode="create" />)).toThrow(TypeError);
  });

  it("draws the form right to left", () => {
    render(
      <div dir="rtl">
        <ResourceFormPage resource={Products} mode="create" />
      </div>,
    );
    expect(screen.getByText("text:name")).toBeDefined();
  });
});
