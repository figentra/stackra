/**
 * Stackra file contract:
 * Purpose: unit and type tests of `url()`: absolute URLs with a scheme and an authority pass (web, websocket and app
 *          schemes), `mailto:` and relative paths fail, and the output is the contracts `Url`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import type { Url } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import { url } from "#core/functions/url.function";

describe("url()", () => {
  it.each([
    "https://api.example.com",
    "https://shop.example.com/m/orders?tab=paid",
    "wss://realtime.example.com",
    "acme://auth/callback",
  ])("accepts %s", (value) => {
    expect(url().parse(value)).toBe(value);
  });

  it.each(["mailto:team@example.com", "/orders", "example.com", "https://", "", 42])(
    "refuses %j",
    (value) => {
      expect(url().safeParse(value).success).toBe(false);
    },
  );

  it("outputs Url", () => {
    expectTypeOf<z.output<ReturnType<typeof url>>>().toEqualTypeOf<Url>();
  });
});
