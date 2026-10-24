/**
 * Stackra file contract:
 * Purpose: unit tests of `HookEvent`: the four assistant events, as snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 2); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { HookEvent } from "#core/enums/hook-event.enum";

describe("HookEvent", () => {
  it("lists the four events", () => {
    expect(Enum.values(HookEvent)).toEqual([
      "session_start",
      "prompt_submit",
      "pre_tool_use",
      "post_tool_use",
    ]);
    expect(HookEvent.PreToolUse).toBe("pre_tool_use");
    expectTypeOf<HookEvent>().toEqualTypeOf<
      "session_start" | "prompt_submit" | "pre_tool_use" | "post_tool_use"
    >();
  });
});
