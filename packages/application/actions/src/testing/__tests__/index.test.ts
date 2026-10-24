/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./testing` entry: every value the template imports from
 *          `@stackra/actions/testing` (`extension`, `fakeActionContext`, `fakeExtensionContext`, `run`) and the plugin are
 *          exported, nothing else is, and its types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#testing` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0294 (decision 15).
 */
import type { Actor } from "@stackra/contracts";
import type { Refusal } from "@stackra/errors";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { ActionContext } from "#core/index";
import * as testing from "#testing/index";
import type { FakeActionContext, RunOptions, RunResult, SlotKey } from "#testing/index";

describe("@stackra/actions/testing", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(testing).sort()).toEqual([
      "ACTIONS_TESTING_PLUGIN",
      "extension",
      "fakeActionContext",
      "fakeExtensionContext",
      "run",
    ]);
  });

  it("resolves its types", () => {
    expectTypeOf<RunOptions["as"]>().toEqualTypeOf<Actor>();
    expectTypeOf<RunResult<number>["output"]>().toEqualTypeOf<number>();
    expectTypeOf<RunResult<number>["error"]>().toEqualTypeOf<Refusal | undefined>();
    expectTypeOf<FakeActionContext>().toMatchTypeOf<ActionContext>();
    expectTypeOf<SlotKey<{ a: { "~slot": "after" }; b: string }>>().toEqualTypeOf<"a">();
  });
});
