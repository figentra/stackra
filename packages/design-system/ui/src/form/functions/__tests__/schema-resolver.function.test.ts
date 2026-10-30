/**
 * Stackra file contract:
 * Purpose: proves `schemaResolver` hands back the parsed values of a valid form (trimmed, defaults applied) and, for an
 *          invalid one, the first message of each failing path, nested the way react-hook-form reads it.
 * Boundary: test only; plain zod schemas, no React.
 * Runtime: node
 * Governing contract: ADR 0055; ADR 0022 (test placement).
 */
import type { ResolverOptions } from "react-hook-form";
import { z } from "zod";

import { schemaResolver } from "#form/functions/schema-resolver.function";

const schema = z.object({
  name: z.string().trim().min(2, "too_short"),
  lines: z.array(z.object({ variantId: z.string().min(1, "required"), quantity: z.number() })),
  quantity: z.number().default(1),
});

/** The options react-hook-form passes; the resolver reads none of them. */
const options = { fields: {}, shouldUseNativeValidation: false } as ResolverOptions<
  Record<string, unknown>
>;

describe("schemaResolver", () => {
  it("returns the parsed values of a valid form", async () => {
    const result = await schemaResolver(schema)(
      { name: "  Ada ", lines: [{ variantId: "var_1", quantity: 2 }] },
      undefined,
      options,
    );
    expect(result).toEqual({
      values: { name: "Ada", lines: [{ variantId: "var_1", quantity: 2 }], quantity: 1 },
      errors: {},
    });
  });

  it("nests the first message of each failing path", async () => {
    const result = await schemaResolver(schema)(
      { name: "A", lines: [{ variantId: "", quantity: 1 }] },
      undefined,
      options,
    );
    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      name: { message: "too_short" },
      lines: [{ variantId: { message: "required" } }],
    });
  });

  it("keeps a path's first message when Zod reports several", async () => {
    const code = z.object({ code: z.string().min(4, "too_short").regex(/^\d+$/, "digits_only") });
    const result = await schemaResolver(code)({ code: "ab" }, undefined, options);
    expect(result.errors).toEqual({ code: { type: "too_small", message: "too_short" } });
  });
});
