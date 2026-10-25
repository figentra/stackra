/**
 * Stackra file contract:
 * Purpose: proves the native `Field` parts inside `Form form={...}`, in the template's create-order shape:
 *          `Field.Text` and `Field.Number` receive the form's value and binding, write the user's value back, and the
 *          caller's props (`testID`, `className`, `isRequired`) reach the field after the binding.
 * Boundary: React Native does not render in vitest, so react-native and the two native fields are replaced by
 *           recording stand-ins; what reaches the fields is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0055 (decision 2); ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { registerSchemas } from "@stackra/validation";
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { z } from "zod";

import { Field } from "#native/field/field";
import { Form } from "#native/form/form";
import { useSchemaForm } from "#native/schema-form/use-schema-form";

/** The props each stand-in was last handed, by field name. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
  };
});

vi.mock("#native/text-field/text-field", () => ({
  TextField: (props: Record<string, unknown>) => {
    received.props[String(props["name"])] = props;
    return null;
  },
}));

vi.mock("#native/number-field/number-field", () => ({
  NumberField: (props: Record<string, unknown>) => {
    received.props[String(props["name"])] = props;
    return null;
  },
}));

/** The create-order form. */
class CreateOrderForm {
  variantId!: string;

  quantity!: number;
}

registerSchemas([
  [CreateOrderForm, z.object({ variantId: z.string().min(1), quantity: z.number().default(1) })],
]);

/** The sheet's form. */
function CreateOrder() {
  const form = useSchemaForm(CreateOrderForm, { defaultValues: { variantId: "var_1" } });
  return (
    <Form form={form}>
      <Field.Text name="variantId" label="Variant" isRequired testID="field-variant" />
      <Field.Number name="quantity" label="Quantity" className="flex-1" />
    </Form>
  );
}

describe("Field (native)", () => {
  it("hands each field its binding and the caller's props", () => {
    render(<CreateOrder />);
    expect(received.props["variantId"]).toMatchObject({
      value: "var_1",
      label: "Variant",
      isRequired: true,
      isInvalid: false,
      testID: "field-variant",
    });
    expect(received.props["quantity"]).toMatchObject({ value: 1, className: "flex-1" });
  });

  it("writes the user's value back", () => {
    render(<CreateOrder />);
    act(() => (received.props["quantity"]?.["onChange"] as (value: number) => void)(4));
    expect(received.props["quantity"]?.["value"]).toBe(4);
  });
});
