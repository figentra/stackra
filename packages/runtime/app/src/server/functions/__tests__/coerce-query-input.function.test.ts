/**
 * Stackra file contract:
 * Purpose: unit tests of `coerceQueryInput` and its use by `serveGuardedCall` over a registered input schema: `limit=20`
 *          becomes 20, `limit=abc` stays a string and the schema refuses it, `active=true` becomes true, repeated and
 *          single values fill an array field, a string field keeps `"007"`, a wrapped (optional, default) number
 *          coerces, an unregistered class or none coerces nothing.
 * Boundary: test only; real zod schemas registered with `registerSchemas`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (STA-2577 note); ADR 0095 as amended by 0294.
 */
import { ActorKind } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, schemaOf } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { coerceQueryInput } from "#server/functions/coerce-query-input.function";
import { serveGuardedCall } from "#server/functions/serve-guarded-call.function";

/** A list query's input. */
class ListInput {}
registerSchemas([
  [
    ListInput,
    z.object({
      limit: z.number().int().optional(),
      page: z.number().default(1),
      active: z.boolean().optional(),
      ids: z.array(z.string()).optional(),
      sizes: z.array(z.number()).optional(),
      code: z.string().optional(),
      status: z.enum(["open", "paid"]).optional(),
    }),
  ],
]);

/** A class nobody registered. */
class UnregisteredInput {}

describe(coerceQueryInput, () => {
  it("turns a finite number into a number and leaves other text as sent", () => {
    expect(coerceQueryInput({ limit: "20", page: "2.5" }, ListInput)).toEqual({
      limit: 20,
      page: 2.5,
    });
    const refused = coerceQueryInput({ limit: "abc" }, ListInput);
    expect(refused).toEqual({ limit: "abc" });
    expect(schemaOf(ListInput).safeParse(refused).success).toBe(false);
    expect(coerceQueryInput({ limit: "" }, ListInput)).toEqual({ limit: "" });
  });

  it("takes true and false only for a boolean", () => {
    expect(coerceQueryInput({ active: "true" }, ListInput)).toEqual({ active: true });
    expect(coerceQueryInput({ active: "false" }, ListInput)).toEqual({ active: false });
    expect(coerceQueryInput({ active: "1" }, ListInput)).toEqual({ active: "1" });
  });

  it("fills an array field from repeated and from single values, element-wise", () => {
    expect(coerceQueryInput({ ids: ["a", "b"] }, ListInput)).toEqual({ ids: ["a", "b"] });
    expect(coerceQueryInput({ ids: "a" }, ListInput)).toEqual({ ids: ["a"] });
    expect(coerceQueryInput({ sizes: ["1", "x"] }, ListInput)).toEqual({ sizes: [1, "x"] });
  });

  it("keeps an enum value a string, valid or not, for the schema to judge", () => {
    const valid = coerceQueryInput({ status: "open" }, ListInput);
    expect(valid).toEqual({ status: "open" });
    expect(schemaOf(ListInput).safeParse(valid).success).toBe(true);
    const invalid = coerceQueryInput({ status: "void" }, ListInput);
    expect(invalid).toEqual({ status: "void" });
    expect(schemaOf(ListInput).safeParse(invalid).success).toBe(false);
  });

  it("keeps a string field as sent", () => {
    expect(coerceQueryInput({ code: "007" }, ListInput)).toEqual({ code: "007" });
  });

  it("leaves unknown fields alone and coerces nothing without a registered schema", () => {
    expect(coerceQueryInput({ other: "1" }, ListInput)).toEqual({ other: "1" });
    expect(coerceQueryInput({ limit: "20" }, UnregisteredInput)).toEqual({ limit: "20" });
    expect(coerceQueryInput({ limit: "20" }, undefined)).toEqual({ limit: "20" });
  });
});

describe("serveGuardedCall query input", () => {
  it("passes a GET's typed query to the call", async () => {
    const execute = vi.fn(async () => ({}));
    await serveGuardedCall({
      request: new Request("https://api.example.test/orders?limit=20&ids=a&active=true"),
      path: "/orders",
      maxBodyBytes: 1024,
      anonymous: true,
      input: ListInput,
      guard: async () => undefined,
      authenticate: async () => ({ actor: { kind: ActorKind.Anonymous, id: "anon_1" as never } }),
      execute,
    });
    expect(execute.mock.calls[0]?.[0]).toEqual({ limit: 20, ids: ["a"], active: true });
  });
});
