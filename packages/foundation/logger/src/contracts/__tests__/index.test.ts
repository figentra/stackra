/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: it exports exactly `LogReporter` and `LogLevel`, and
 *          the `LogRecord` type resolves.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { LogLevel, LogRecord } from "#contracts/index";

describe("@stackra/logger/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual(["LogLevel", "LogReporter"]);
  });

  it("resolves its public types", () => {
    expectTypeOf<LogRecord["level"]>().toEqualTypeOf<LogLevel>();
  });
});
