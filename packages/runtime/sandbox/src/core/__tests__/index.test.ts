/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: `Sandbox` and its two refusals are the only values, and the request,
 *          language, limits, limit and result types resolve to the shapes a code step passes and reads.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import type { Duration, Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as sandbox from "#core/index";
import type {
  SandboxLanguage,
  SandboxLimit,
  SandboxLimits,
  SandboxRequest,
  SandboxResult,
} from "#core/index";

describe("@stackra/sandbox", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(sandbox).sort()).toEqual([
      "Sandbox",
      "SandboxCodeFailedError",
      "SandboxLimitExceededError",
    ]);
  });

  it("resolves the request, limits and result types", () => {
    expectTypeOf<SandboxLanguage>().toEqualTypeOf<"javascript" | "python">();
    expectTypeOf<SandboxRequest["language"]>().toEqualTypeOf<SandboxLanguage | undefined>();
    expectTypeOf<SandboxLimit>().toEqualTypeOf<"time" | "memory" | "output">();
    expectTypeOf<SandboxLimits["time"]>().toEqualTypeOf<Duration>();
    expectTypeOf<SandboxLimits["memoryBytes"]>().toEqualTypeOf<number>();
    expectTypeOf<SandboxRequest["input"]>().toEqualTypeOf<Json>();
    expectTypeOf<SandboxRequest["allowedOrigins"]>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<SandboxResult["output"]>().toEqualTypeOf<Json>();
    expectTypeOf<SandboxResult["codeMs"]>().toEqualTypeOf<number>();
    expectTypeOf<sandbox.Sandbox["run"]>().returns.toEqualTypeOf<Promise<SandboxResult>>();
  });
});
