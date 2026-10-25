/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LogLevel`: an `Enum.of` value with the four snake_case codes in severity order, a
 *          same-named type, and codes that name `console` methods.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0147.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { LogLevel } from "#contracts/enums/log-level.enum";

describe("LogLevel", () => {
  it("lists the four levels lowest first", () => {
    expect(Enum.values(LogLevel)).toEqual(["debug", "info", "warn", "error"]);
    expect(LogLevel.Warn).toBe("warn");
  });

  it("types one code", () => {
    expectTypeOf<LogLevel>().toEqualTypeOf<"debug" | "info" | "warn" | "error">();
  });

  it("names a console method with every code", () => {
    for (const level of Enum.values(LogLevel)) expect(typeof console[level]).toBe("function");
  });
});
