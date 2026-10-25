/**
 * Stackra file contract:
 * Purpose: unit tests of `fieldErrorsOf`: a zod error's issues by path (the first per path winning), a refusal's field
 *          errors, and anything else rethrown.
 * Boundary: test only; a local refusal class stands in for a client refusal.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fieldErrorsOf } from "#core/functions/field-errors-of.function";

class SettingsLockedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

describe("fieldErrorsOf", () => {
  it("maps a zod error's issues by path, the first per path winning", () => {
    const result = z
      .object({
        email: z.string().email("leads::errors.email"),
        lines: z.array(z.object({ quantity: z.number().min(1) })),
      })
      .safeParse({ email: "nope", lines: [{ quantity: 0 }] });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrorsOf(result.error)).toMatchObject({ email: "leads::errors.email" });
    expect(Object.keys(fieldErrorsOf(result.error))).toEqual(["email", "lines.0.quantity"]);
  });

  it("takes a refusal's field errors", () => {
    const refusal = SettingsLockedError.create(
      {},
      { fieldErrors: { "orders.cutoff": "settings_locked" } },
    );
    expect(fieldErrorsOf(refusal)).toEqual({ "orders.cutoff": "settings_locked" });
  });

  it("rethrows anything without field errors", () => {
    const failure = new Error("gateway down");
    expect(() => fieldErrorsOf(failure)).toThrow(failure);
    expect(() => fieldErrorsOf(SettingsLockedError.create())).toThrow(SettingsLockedError);
  });
});
