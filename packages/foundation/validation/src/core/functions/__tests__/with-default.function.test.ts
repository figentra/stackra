/**
 * Stackra file contract:
 * Purpose: unit and type tests of `withDefault(schema)(factory)`: a missing value parses to the factory's literal, each
 *          parse gets its own copy, a given value wins, and the factory's literal is typed by the schema's output (codes
 *          stay literal, record values keep their type, a duration may be its text; a wrong code does not compile).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26);
 *                     STA-1605.
 */
import type { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { duration } from "#core/functions/duration.function";
import { withDefault } from "#core/functions/with-default.function";
import type { DefaultLiteral } from "#core/types/default-literal.type";

const OG = z.object({
  kinds: z.array(z.enum(["site", "page", "product"])),
  flow: z.record(z.string(), z.enum(["bff", "pkce"])),
  // A duration field, as gen writes one.
  timeout: z.string().transform(duration),
});

describe("withDefault()", () => {
  const og = withDefault(OG)(() => ({
    kinds: ["site", "page"],
    flow: { web: "bff", ios: "pkce" },
    timeout: "PT2S",
  }));

  it("parses a missing value to the factory's literal", () => {
    expect(og.parse(undefined)).toEqual({
      kinds: ["site", "page"],
      flow: { web: "bff", ios: "pkce" },
      timeout: "PT2S",
    });
  });

  it("builds a fresh object on every parse", () => {
    const first = og.parse(undefined);
    first.kinds.push("product");
    expect(og.parse(undefined).kinds).toEqual(["site", "page"]);
  });

  it("parses a given value through the schema", () => {
    expect(og.parse({ kinds: ["product"], flow: {}, timeout: "60s" })).toEqual({
      kinds: ["product"],
      flow: {},
      timeout: "PT1M",
    });
  });

  it("defaults an array", () => {
    expect(withDefault(z.array(z.enum(["a", "b"])))(() => ["a"]).parse(undefined)).toEqual(["a"]);
  });

  it("types the literal by the schema's output", () => {
    expectTypeOf(og).toEqualTypeOf<z.ZodDefault<typeof OG>>();
    expectTypeOf<DefaultLiteral<{ timeout: Duration; at: Duration[] }>>().toEqualTypeOf<{
      timeout: `P${string}`;
      at: `P${string}`[];
    }>();
    // @ts-expect-error -- "blog" is not one of the kinds, so the literal does not compile
    withDefault(OG)(() => ({ kinds: ["blog"], flow: {}, timeout: "PT1S" }));
    // @ts-expect-error -- a flow value is "bff" or "pkce"
    withDefault(OG)(() => ({ kinds: [], flow: { web: "cookie" }, timeout: "PT1S" }));
  });
});
