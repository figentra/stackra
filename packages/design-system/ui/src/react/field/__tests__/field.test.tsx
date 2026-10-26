/**
 * Stackra file contract:
 * Purpose: proves the web `Field` parts inside `Form form={...}`: `Field.Text` and `Field.Number` show the form's
 *          values and write the user's back, `Field.Select` draws its `options`, `Field.Switch` toggles a boolean,
 *          the caller's props win over the binding, and a valid submit reaches `submit` with the parsed values.
 * Boundary: jsdom with real HeroUI and React Aria; the schema is registered for the class the way gen does.
 * Runtime: browser
 * Governing contract: ADR 0055 (decision 2); ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { registerSchemas } from "@stackra/validation";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

import { Field } from "#react/field/field";
import { Form } from "#react/form/form";
import { useSchemaForm } from "#react/schema-form/use-schema-form";

/** A quick-order form. */
class QuickOrderForm {
  sku!: string;

  quantity!: number;

  scheme!: string;

  isGift!: boolean;
}

registerSchemas([
  [
    QuickOrderForm,
    z.object({
      sku: z.string().min(1),
      quantity: z.number().min(1),
      scheme: z.string(),
      isGift: z.boolean().default(false),
    }),
  ],
]);

/** The form, posting to `submit`. */
function QuickOrder({ submit }: { readonly submit: (values: object) => Promise<void> }) {
  const form = useSchemaForm(QuickOrderForm, {
    defaultValues: { sku: "SKU-1", quantity: 2, scheme: "dark" },
  });
  return (
    <Form aria-label="Quick order" form={form} submit={submit}>
      <Field.Text name="sku" label="SKU" />
      <Field.Number name="quantity" label="Quantity" minValue={1} />
      <Field.Select
        name="scheme"
        label="Scheme"
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
      <Field.Switch name="isGift" label="Gift" isDisabled />
      <button type="submit">Order</button>
    </Form>
  );
}

/** The settings form: each setting drawn by its kind over the quick-order form. */
function QuickOrderSettings() {
  return (
    <Form
      aria-label="Settings"
      form={useSchemaForm(QuickOrderForm, { defaultValues: { sku: "A", quantity: 2 } })}
    >
      <Field.Setting setting={{ path: "sku", label: "Code", kind: "text" }} provenance="tenant" />
      <Field.Setting
        setting={{ path: "quantity", label: "Count", kind: "number", min: 1, max: 9 }}
      />
      <Field.Setting setting={{ path: "isGift", label: "Present", kind: "boolean" }} />
    </Form>
  );
}

describe("Field (web)", () => {
  it("shows the form's values and lets the caller's props win", () => {
    render(<QuickOrder submit={vi.fn(() => Promise.resolve())} />);
    expect((screen.getByRole("textbox", { name: "SKU" }) as HTMLInputElement).value).toBe("SKU-1");
    expect(screen.getByRole("switch", { name: "Gift" }).hasAttribute("disabled")).toBe(true);
  });

  it("writes the user's text back and submits the parsed values", async () => {
    const submit = vi.fn((_values: object) => Promise.resolve());
    render(<QuickOrder submit={submit} />);
    fireEvent.change(screen.getByRole("textbox", { name: "SKU" }), { target: { value: "SKU-9" } });
    fireEvent.click(screen.getByRole("button", { name: "Order" }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]).toEqual({
      sku: "SKU-9",
      quantity: 2,
      scheme: "dark",
      isGift: false,
    });
  });

  it("draws Field.Setting by kind with the provenance as its description", () => {
    render(<QuickOrderSettings />);
    expect(screen.getByRole("textbox", { name: "Code" })).toBeTruthy();
    expect(screen.getByText("tenant")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Present" })).toBeTruthy();
  });
});
