/**
 * Stackra file contract:
 * Purpose: proves `useSchemaField` binds the named field of the surrounding form (value, change) and that a change
 *          clears a server error on that field.
 * Boundary: jsdom through `renderHook`, wrapped in react-hook-form's `FormProvider` as the renderers' `Form` wraps it.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { useSchemaField } from "#form/schema-form/use-schema-field";

/** The field and its form, rendered together so the test can reach both. */
function useBoundField() {
  const form = useForm({ defaultValues: { quantity: 2 } });
  return { form, wrap: (children: ReactNode) => <FormProvider {...form}>{children}</FormProvider> };
}

describe("useSchemaField", () => {
  it("binds the named field and clears a server error on change", () => {
    let form: ReturnType<typeof useBoundField>["form"] | undefined;
    const { result } = renderHook(() => useSchemaField<number>("quantity"), {
      wrapper: ({ children }) => {
        const bound = useBoundField();
        form = bound.form;
        return bound.wrap(children);
      },
    });
    expect(result.current).toMatchObject({ name: "quantity", value: 2, isInvalid: false });

    act(() => form?.setError("quantity", { type: "server", message: "insufficient_stock" }));
    expect(result.current).toMatchObject({ isInvalid: true, errorMessage: "insufficient_stock" });

    act(() => result.current.onChange(3));
    expect(result.current).toMatchObject({ value: 3, isInvalid: false });
  });
});
