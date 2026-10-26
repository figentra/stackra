/**
 * Stackra file contract:
 * Purpose: proves `useSchemaFormHandle` opens with the schema's defaults under the caller's, binds a field through
 *          `field(name)` (value, change, error), shows a server error until the field changes, refuses an invalid
 *          submit with errors on the fields and an `undefined` result, and hands back the submit's result when valid.
 * Boundary: jsdom through `renderHook`; the schema is registered for the class the way gen does.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0140; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { registerSchemas } from "@stackra/validation";
import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

import { useSchemaFormHandle } from "#form/schema-form/use-schema-form-handle";

/** An order line form. */
class OrderForm {
  variantId!: string;

  quantity!: number;
}

registerSchemas([
  [
    OrderForm,
    z.object({
      variantId: z.string({ error: "required" }).min(1, "required"),
      quantity: z.number().min(1).default(1),
    }),
  ],
]);

describe("useSchemaFormHandle", () => {
  it("opens with the schema's defaults under the caller's", () => {
    const { result } = renderHook(() =>
      useSchemaFormHandle(OrderForm, { defaultValues: { variantId: "var_1" } }),
    );
    expect(result.current.getValues()).toEqual({ variantId: "var_1", quantity: 1 });
  });

  it("binds a field and stores what it reports", () => {
    const { result } = renderHook(() => useSchemaFormHandle(OrderForm));
    expect(result.current.field("quantity")).toMatchObject({
      name: "quantity",
      value: 1,
      isInvalid: false,
    });
    act(() => result.current.field("variantId").onChange?.("var_9"));
    expect(result.current.field("variantId").value).toBe("var_9");
  });

  it("shows a server error until the field changes", async () => {
    const serverErrors = { variantId: "variant_unavailable" };
    const { result } = renderHook(() => useSchemaFormHandle(OrderForm, { serverErrors }));
    await waitFor(() =>
      expect(result.current.field("variantId")).toMatchObject({
        isInvalid: true,
        errorMessage: "variant_unavailable",
      }),
    );
    act(() => result.current.field("variantId").onChange?.("var_2"));
    expect(result.current.field("variantId").isInvalid).toBe(false);
  });

  it("refuses an invalid submit and returns the result of a valid one", async () => {
    const { result } = renderHook(() => useSchemaFormHandle(OrderForm));
    const onValid = vi.fn((values: OrderForm) => ({ ordered: values.quantity }));
    let answer: unknown;
    await act(async () => {
      answer = await result.current.handleSubmit(onValid)();
    });
    expect(answer).toBeUndefined();
    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.field("variantId").errorMessage).toBe("required");

    act(() => result.current.field("variantId").onChange?.("var_1"));
    await act(async () => {
      answer = await result.current.handleSubmit(onValid)();
    });
    expect(answer).toEqual({ ordered: 1 });
  });
});
