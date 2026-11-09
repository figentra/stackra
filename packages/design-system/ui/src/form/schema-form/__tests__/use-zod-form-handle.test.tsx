/**
 * Stackra file contract:
 * Purpose: proves `useZodFormHandle` runs a form over a zod schema with no class: a JSON Schema input made zod (as the
 *          chat's action form builds it) opens with its defaults under the caller's prefilled values, refuses a submit
 *          that misses a required key with the error on that field, and hands the checked values to a valid submit.
 * Boundary: jsdom through `renderHook`; the schema comes from `z.fromJSONSchema`, as a manifest's input would.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0140; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { z } from "zod";

import { useZodFormHandle } from "#form/schema-form/use-zod-form-handle";

/** An action input as a manifest writes it. */
const INPUT = z.fromJSONSchema({
  type: "object",
  required: ["note", "quantity"],
  properties: {
    note: { type: "string", minLength: 1 },
    quantity: { type: "integer", minimum: 1, default: 1 },
  },
});

/** `useZodFormHandle` over a JSON Schema input made zod. */
describe("useZodFormHandle", () => {
  /** The schema's default stays where the caller prefilled nothing. */
  it("opens with the schema's defaults under the caller's", () => {
    const { result } = renderHook(() =>
      useZodFormHandle<Record<string, unknown>>(INPUT, { defaultValues: { note: "Rush" } }),
    );
    expect(result.current.getValues()).toEqual({ note: "Rush", quantity: 1 });
  });

  /** A missing required key fails on its field; a filled form submits its values. */
  it("refuses a missing key and submits a valid form", async () => {
    const { result } = renderHook(() => useZodFormHandle<Record<string, unknown>>(INPUT));
    const onValid = vi.fn((values: Record<string, unknown>) => values);
    let answer: unknown;
    await act(async () => {
      answer = await result.current.handleSubmit(onValid)();
    });
    expect(answer).toBeUndefined();
    expect(result.current.field("note").isInvalid).toBe(true);
    act(() => result.current.field("note").onChange?.("Rush"));
    await act(async () => {
      answer = await result.current.handleSubmit(onValid)();
    });
    expect(answer).toEqual({ note: "Rush", quantity: 1 });
  });
});
