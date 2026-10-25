/**
 * Stackra file contract:
 * Purpose: unit tests of `BotMode`: off and the runway's `likely-automated-challenge`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0038 (decision 1, carried forward by ADR 0217).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BotMode } from "#core/enums/bot-mode.enum";

describe("BotMode", () => {
  it("lists the two modes", () => {
    expect(Enum.values(BotMode)).toEqual(["off", "likely-automated-challenge"]);
    expectTypeOf<BotMode>().toEqualTypeOf<"off" | "likely-automated-challenge">();
  });
});
