/**
 * Stackra file contract:
 * Purpose: unit tests of `ACTION_PERMISSION_RULES`: the consumer `ai.action_permissions` with one `row` outcome kind
 *          whose state codes are `ActionPermission`'s, an action and state required and every narrowing optional, up
 *          to 500 rows, and `{ all: [] }` as its condition.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0398 (decision 1); STA-1250.
 */
import { ActionPermission } from "@stackra/ai";
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ACTION_PERMISSION_RULES } from "#core/constants/action-permission-rules.constant";

describe("ACTION_PERMISSION_RULES", () => {
  it("is the ai.action_permissions consumer with one row kind", () => {
    expect(ACTION_PERMISSION_RULES.key).toBe("ai.action_permissions");
    expect(ACTION_PERMISSION_RULES.outcomeKinds().map((kind) => kind.key)).toEqual(["row"]);
    expect(ACTION_PERMISSION_RULES.check({ all: [] })).toEqual({ all: [] });
  });

  it("offers exactly the ActionPermission states", () => {
    const state = ACTION_PERMISSION_RULES.outcomeKind("row")?.params["state"];
    expect(Object.keys(state?.values ?? {}).sort()).toEqual(
      [...Enum.values(ActionPermission)].sort(),
    );
  });

  it("requires the action and state only, up to 500 rows", () => {
    const row = { kind: "row", params: { action: "legal.claim.file@1", state: "suggest" } };
    expect(ACTION_PERMISSION_RULES.outcomeProblems(Array.from({ length: 500 }, () => row))).toEqual(
      {},
    );
    expect(
      ACTION_PERMISSION_RULES.outcomeProblems([{ kind: "row", params: { role: "associate" } }]),
    ).toEqual({
      "0.params.action": "param_missing",
      "0.params.state": "param_missing",
    });
    expect(ACTION_PERMISSION_RULES.outcomeProblems(Array.from({ length: 501 }, () => row))).toEqual(
      {
        "(root)": "too_many_outcomes",
      },
    );
  });
});
