/**
 * Stackra file contract:
 * Purpose: unit tests of `actionLabelKey`: the resource's own action keeps its verb key, another model's action takes
 *          its model before the verb, so two `set` actions on one page get two keys.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307.
 */
import { describe, expect, it } from "@stackra/testing";

import { actionLabelKey } from "#core/functions/action-label-key.function";

describe("actionLabelKey", () => {
  it("keeps the verb for the resource's own action", () => {
    expect(actionLabelKey("orders.order", "orders.order.cancel@1")).toBe(
      "orders::resources.order.actions.cancel",
    );
  });

  it("names another model's action by its model and verb", () => {
    const member = actionLabelKey("commerce.company", "commerce.company_member.set@1");
    const minimum = actionLabelKey("commerce.company", "commerce.company_minimum.set@2");
    expect(member).toBe("commerce::resources.company.actions.company_member_set");
    expect(minimum).toBe("commerce::resources.company.actions.company_minimum_set");
  });
});
