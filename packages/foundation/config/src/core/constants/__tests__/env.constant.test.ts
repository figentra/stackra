/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `env` value parsers the generated Expo config uses: `str`, `url` and `enum`,
 *          `.optional()`, `.default(v)` and `.allowEmpty()`, with an empty string counted as unset, each chain call
 *          returning a new parser, and every failure a `ConfigInvalidError` that names the variable, not the value.
 * Boundary: test only; the calls mirror `apps/mobile/.stackra/app.config.ts` in the template.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decisions 2 and
 *                     4).
 */
import type { Url } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { env } from "#core/constants/env.constant";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";

const ENVIRONMENTS = ["dev", "preview", "staging", "production"] as const;

describe("env", () => {
  it("parses a string, counting an empty one as unset unless allowed", () => {
    expect(env.str().parse("acme")).toBe("acme");
    expect(() => env.str().parse("", "EXPO_PUBLIC_EAS_PROJECT_ID")).toThrow(ConfigInvalidError);
    expect(() => env.str().parse(undefined, "EXPO_PUBLIC_EAS_PROJECT_ID")).toThrow(
      "env is invalid: EXPO_PUBLIC_EAS_PROJECT_ID: is not set",
    );
    expect(env.str().allowEmpty().parse("")).toBe("");
    expect(env.str().optional().parse(undefined)).toBeUndefined();
    expect(env.str().optional().parse("")).toBeUndefined();
    expectTypeOf(env.str().parse("x")).toEqualTypeOf<string>();
    expectTypeOf(env.str().optional().parse("x")).toEqualTypeOf<string | undefined>();
  });

  it("parses one of a list, with a default for an unset value", () => {
    expect(env.enum(ENVIRONMENTS).parse("staging")).toBe("staging");
    expect(env.enum(ENVIRONMENTS).default("dev").parse(undefined)).toBe("dev");
    expect(env.enum(ENVIRONMENTS).default("dev").parse("production")).toBe("production");
    expect(() => env.enum(ENVIRONMENTS).parse("prod", "STACKRA_ENVIRONMENT")).toThrow(
      /STACKRA_ENVIRONMENT/,
    );
    expect(() => env.enum(ENVIRONMENTS).parse(undefined, "STACKRA_ENVIRONMENT")).toThrow(
      /is not set/,
    );
    expectTypeOf(env.enum(ENVIRONMENTS).default("dev").parse(undefined)).toEqualTypeOf<
      "dev" | "preview" | "staging" | "production"
    >();
  });

  it("parses an absolute URL", () => {
    expect(env.url().parse("http://localhost:5173")).toBe("http://localhost:5173");
    expect(() => env.url().parse("/relative", "EXPO_PUBLIC_APP_ORIGIN")).toThrow(
      /EXPO_PUBLIC_APP_ORIGIN/,
    );
    expectTypeOf(env.url().parse("x")).toEqualTypeOf<Url>();
  });

  it("never prints the value in an error", () => {
    expect(() => env.enum(ENVIRONMENTS).parse("value_canary", "STACKRA_ENVIRONMENT")).not.toThrow(
      /value_canary/,
    );
  });

  it("returns a new parser from each chain call", () => {
    const base = env.str();
    base.optional();
    base.default("x");
    expect(() => base.parse(undefined)).toThrow(ConfigInvalidError);
    expect(Object.isFrozen(env)).toBe(true);
  });
});
