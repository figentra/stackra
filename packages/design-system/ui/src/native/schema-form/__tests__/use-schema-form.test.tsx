/**
 * Stackra file contract:
 * Purpose: proves the native `useSchemaForm` in the template's `useCreateOrder` shape: it opens with the caller's
 *          values over the schema's defaults, and its `handleSubmit` returns `undefined` for an invalid form and the
 *          submit's own result for a valid one, so a button's handler can tell placed from queued.
 * Boundary: jsdom through `renderHook`; nothing of React Native is loaded.
 * Runtime: node
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { registerSchemas } from "@stackra/validation";
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import type { SchemaForm } from "#native/schema-form/schema-form.type";
import { useSchemaForm } from "#native/schema-form/use-schema-form";

/** The create-order form. */
class CreateOrderForm {
  variantId!: string;

  quantity!: number;
}

registerSchemas([
  [CreateOrderForm, z.object({ variantId: z.string().min(1), quantity: z.number().default(1) })],
]);

describe("useSchemaForm (native)", () => {
  it("returns what the submit returned, or nothing when the form is invalid", async () => {
    const { result } = renderHook(() => useSchemaForm(CreateOrderForm));
    expectTypeOf(result.current).toEqualTypeOf<SchemaForm<CreateOrderForm>>();
    const submit = result.current.handleSubmit(() => ({ queued: true as const }));

    let answer: unknown;
    await act(async () => {
      answer = await submit();
    });
    expect(answer).toBeUndefined();

    act(() => result.current.setValue("variantId", "var_1"));
    await act(async () => {
      answer = await result.current.handleSubmit(() => ({ queued: true as const }))();
    });
    expect(answer).toEqual({ queued: true });
    expect(result.current.getValues("quantity")).toBe(1);
  });
});
