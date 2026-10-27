/**
 * Stackra file contract:
 * Purpose: unit tests of `defineActionsDevtools`: the `actions.registry` tab lists each registered action and query
 *          by name with its key, kind, permission, risk, effects and input class, and the remover is the kit's.
 * Boundary: test only; a recording fake stands in for `DevtoolsKit`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0246 (decision 4).
 */
import type { DevtoolsTabSink, DevtoolsTabSinkDefinition } from "@stackra/container/devtools";
import { ActorKind } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Action } from "#core/bases/action.base";
import { Query } from "#core/bases/query.base";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { registerActions } from "#core/functions/register-actions.function";
import { defineActionsDevtools } from "#devtools/functions/define-actions-devtools.function";

class CancelOrderInput {}

class CancelOrderAction extends Action({
  key: "order.cancel",
  actors: [ActorKind.User],
}) {
  async handle(_input: { orderId: string }): Promise<void> {}
}

class GetOrderQuery extends Query({
  key: "order.get",
  actors: [ActorKind.User],
}) {
  async handle(_input: { orderId: string }): Promise<null> {
    return null;
  }
}

/** A kit fake that records every defined tab and every removal. */
function fakeKit(): DevtoolsTabSink & {
  readonly tabs: DevtoolsTabSinkDefinition[];
  readonly removed: string[];
} {
  const tabs: DevtoolsTabSinkDefinition[] = [];
  const removed: string[] = [];
  return {
    tabs,
    removed,
    defineTab: (definition) => {
      tabs.push(definition);
      return () => {
        removed.push(definition.id);
      };
    },
  };
}

beforeEach(() => {
  ACTION_REGISTRY.clear();
});

describe("defineActionsDevtools", () => {
  it("lists every registered action and query by name", () => {
    registerActions([
      {
        type: CancelOrderAction,
        key: "orders.order.cancel@1",
        permission: "orders.order.cancel",
        risk: "L2",
        input: CancelOrderInput,
      },
      { type: GetOrderQuery, key: "orders.order.get@1" },
    ]);
    const kit = fakeKit();
    defineActionsDevtools(kit);
    expect(kit.tabs.map((tab) => [tab.id, tab.category])).toEqual([
      ["actions.registry", "actions"],
    ]);
    expect(kit.tabs[0]?.read()).toEqual([
      {
        key: "orders.order.cancel@1",
        kind: "action",
        type: "CancelOrderAction",
        permission: "orders.order.cancel",
        risk: "L2",
        effects: [],
        input: "CancelOrderInput",
      },
      {
        key: "orders.order.get@1",
        kind: "query",
        type: "GetOrderQuery",
        permission: undefined,
        risk: undefined,
        effects: [],
        input: undefined,
      },
    ]);
  });

  it("reads the registry when opened, and returns the kit's remover", () => {
    const kit = fakeKit();
    const remove = defineActionsDevtools(kit);
    expect(kit.tabs[0]?.read()).toEqual([]);
    registerActions([{ type: GetOrderQuery, key: "orders.order.get@1" }]);
    expect(kit.tabs[0]?.read()).toHaveLength(1);
    remove();
    expect(kit.removed).toEqual(["actions.registry"]);
  });
});
