/**
 * Stackra file contract:
 * Purpose: unit tests of `ChatFormPart`: a skeleton while the schema loads and a line when it cannot be shown; one field
 *          per top-level key in the schema's order, labelled by the host, the schema's title or the key, required as the
 *          schema says, with the action's model naming the enum labels; long text as a text area and several codes as a
 *          multi-select; an upload through the host's `upload`, held as `{ id }`, a failed upload said, and no upload
 *          without one; a send hands the checked values to `onSubmit` and leaves the form read-only, as `isSent` does.
 * Boundary: unit tier, jsdom; the web kit, the form engine and `ResourceFormField` are stand-ins, translation returns
 *           the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (form keys are input paths); Tamo spec
 *                     generative-ui-tools-artifacts (G3)
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { ChatFormPart } from "#react/chat-form-part/chat-form-part";

const spies = vi.hoisted(() => ({
  nodes: [] as { readonly resourceKey: string; readonly node: Record<string, unknown> }[],
  fields: {} as Record<string, unknown>,
  onChange: vi.fn(),
  checked: {} as Record<string, unknown>,
}));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
}));
vi.mock("@stackra/ui/form", () => ({
  useZodFormHandle: () => ({ formState: { isSubmitting: false } }),
  useSchemaField: (name: string) => ({
    name,
    value: spies.fields[name],
    onChange: (value: unknown) => spies.onChange(name, value),
  }),
}));
vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: { readonly children: ReactNode; readonly isDisabled?: boolean }) =>
      createElement("button", { type: "submit", disabled: props.isDisabled }, props.children),
    FileTrigger: (props: {
      readonly children: ReactNode;
      readonly isDisabled?: boolean;
      readonly onSelect: (files: readonly File[]) => void;
    }) =>
      createElement(
        "label",
        null,
        props.children,
        createElement("input", {
          type: "file",
          "aria-label": "file",
          disabled: props.isDisabled,
          onChange: (event: { readonly target: { readonly files: FileList } }) =>
            props.onSelect([...event.target.files]),
        }),
      ),
    Form: (props: {
      readonly children: ReactNode;
      readonly submit: (values: Record<string, unknown>) => Promise<void>;
    }) =>
      createElement(
        "form",
        {
          onSubmit: (event: { preventDefault: () => void }) => {
            event.preventDefault();
            void props.submit(spies.checked);
          },
        },
        props.children,
      ),
    Skeleton: () => createElement("div", { "data-testid": "skeleton" }),
    Text: (props: { readonly children: ReactNode }) => createElement("span", null, props.children),
  };
});
vi.mock("#react/resource-pages/resource-form-field", async () => {
  const { createElement } = await import("react");
  return {
    ResourceFormField: (props: {
      readonly resourceKey: string;
      readonly node: Record<string, unknown>;
    }) => {
      spies.nodes.push({ resourceKey: props.resourceKey, node: props.node });
      return createElement("span", null, `field:${String(props.node["key"])}`);
    },
  };
});

/** An action input as the tool table holds it. */
const SCHEMA = {
  type: "object",
  required: ["customerId", "note"],
  properties: {
    customerId: { type: "string", pattern: "^cus_[0-9a-hjkmnp-tv-z]{26}$", title: "Customer" },
    note: { type: "string", maxLength: 2000 },
    tags: { type: "array", items: { type: "string", enum: ["rush", "gift"] } },
    totalMinor: { type: "integer" },
  },
};

/** The last props each key was drawn with. */
const nodeOf = (key: string) => [...spies.nodes].reverse().find((each) => each.node["key"] === key);

afterEach(() => {
  cleanup();
  spies.nodes.length = 0;
  spies.fields = {};
  spies.checked = {};
  spies.onChange.mockReset();
});

/** The chat's action form. */
describe("ChatFormPart", () => {
  /** No schema yet draws a skeleton; an unreadable one says the form cannot be shown. */
  it("waits for the schema and says when it cannot be shown", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(
      <ChatFormPart actionKey="orders.order.create@1" schema={undefined} onSubmit={onSubmit} />,
    );
    expect(screen.getAllByTestId("skeleton")).toHaveLength(2);
    rerender(<ChatFormPart actionKey="orders.order.create@1" schema={null} onSubmit={onSubmit} />);
    expect(screen.getByText("panel::chat_form.unavailable")).toBeTruthy();
    rerender(
      <ChatFormPart
        actionKey="orders.order.create@1"
        schema={{ type: "string" }}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText("panel::chat_form.unavailable")).toBeTruthy();
  });

  /** Each key in order, labelled host first, then title, then key; required as the schema says. */
  it("draws one field per key with its label and the chat's controls", () => {
    render(
      <ChatFormPart
        actionKey="orders.order.create@1"
        schema={SCHEMA}
        labels={{ note: "orders::resources.order.fields.note" }}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/^field:/).map((each) => each.textContent)).toEqual([
      "field:customerId",
      "field:note",
      "field:tags",
      "field:totalMinor",
    ]);
    expect(nodeOf("customerId")).toMatchObject({
      resourceKey: "orders.order",
      node: { kind: "value", label: "Customer", isRequired: true, isDisabled: false },
    });
    expect(nodeOf("customerId")?.node["control"]).toBeUndefined();
    expect(nodeOf("note")?.node).toMatchObject({
      label: "orders::resources.order.fields.note",
      control: "textarea",
      isRequired: true,
    });
    expect(nodeOf("tags")?.node).toMatchObject({
      label: "tags",
      control: "multi-select",
      choices: [
        { value: "rush", label: "rush" },
        { value: "gift", label: "gift" },
      ],
      isRequired: false,
    });
    expect(nodeOf("totalMinor")?.node["control"]).toBeUndefined();
  });

  /** A file goes through the host's upload and the field keeps its id; a failure is said. */
  it("uploads a file through the host and holds its id", async () => {
    const schema = {
      type: "object",
      properties: {
        receipt: {
          type: "object",
          properties: { id: { type: "string", pattern: "^upl_[0-9a-hjkmnp-tv-z]{26}$" } },
        },
      },
    };
    const upload = vi
      .fn<(file: File) => Promise<{ readonly id: string }>>()
      .mockResolvedValueOnce({ id: "upl_1" })
      .mockRejectedValueOnce(new RangeError("offline"));
    render(
      <ChatFormPart
        actionKey="pay.expense.submit@1"
        schema={schema}
        upload={upload}
        onSubmit={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("file");
    fireEvent.change(input, { target: { files: [new File(["x"], "receipt.pdf")] } });
    await waitFor(() => expect(spies.onChange).toHaveBeenCalledWith("receipt", { id: "upl_1" }));
    fireEvent.change(input, { target: { files: [new File(["y"], "second.pdf")] } });
    await waitFor(() =>
      expect(
        screen.getByText(
          `panel::chat_form.upload_failed ${JSON.stringify({ name: "second.pdf" })}`,
        ),
      ).toBeTruthy(),
    );
    expect(spies.onChange).toHaveBeenCalledTimes(1);
  });

  /** Without an upload, a file field says files cannot be added. */
  it("says a file cannot be added without an upload", () => {
    const schema = {
      type: "object",
      properties: {
        receipt: {
          type: "object",
          properties: { id: { type: "string", pattern: "^upl_[0-9a-hjkmnp-tv-z]{26}$" } },
        },
      },
    };
    render(<ChatFormPart actionKey="pay.expense.submit@1" schema={schema} onSubmit={vi.fn()} />);
    expect(screen.getByText("panel::chat_form.no_upload")).toBeTruthy();
    expect(screen.queryByLabelText("file")).toBeNull();
  });

  /** Sending hands the checked values over and leaves the form read-only; `isSent` starts it so. */
  it("sends the checked values once and then reads as sent", async () => {
    spies.checked = { customerId: "cus_1", note: "Rush" };
    const onSubmit = vi.fn(async () => undefined);
    render(<ChatFormPart actionKey="orders.order.create@1" schema={SCHEMA} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("panel::chat_form.send"));
    await waitFor(() => expect(screen.getByText("panel::chat_form.sent")).toBeTruthy());
    expect(onSubmit).toHaveBeenCalledWith({ customerId: "cus_1", note: "Rush" });
    expect(nodeOf("note")?.node["isDisabled"]).toBe(true);
    cleanup();
    render(
      <ChatFormPart actionKey="orders.order.create@1" schema={SCHEMA} isSent onSubmit={onSubmit} />,
    );
    expect(screen.getByText("panel::chat_form.sent").closest("button")?.disabled).toBe(true);
  });
});
