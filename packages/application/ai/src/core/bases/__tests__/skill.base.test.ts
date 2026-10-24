/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Skill`: the called form records the `skill` kind with its frozen tools, keeps an
 *          `examples` field typed by `SkillExample`, takes queries (tools by default) and actions with `tool: true`,
 *          and refuses a query with `tool: false`, an action without `tool: true`, a class of another kind, a non-class
 *          and a tool listed twice; a bare `extends Skill` fails to compile.
 * Boundary: test only; the skill is the template's `OrdersSupportSkill` with stand-in order classes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0245 (decision 5); ADR 0155 (decision 1); ADR 0305 (rule 28).
 */
import { Action, type ActionContext, Query, type QueryContext } from "@stackra/actions";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Skill } from "#core/bases/skill.base";
import type { SkillClass } from "#core/types/skill-class.type";
import type { SkillExample } from "#core/types/skill-example.type";

class GetOrderQuery extends Query({ key: "order.get", actors: [ActorKind.User, ActorKind.Agent] }) {
  async handle(input: { orderId: string }, _ctx: QueryContext): Promise<{ id: string }> {
    return { id: input.orderId };
  }
}

class ListOrdersQuery extends Query({
  key: "order.list",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  async handle(_input: { limit: number }, _ctx: QueryContext): Promise<{ items: string[] }> {
    return { items: [] };
  }
}

class CancelOrderAction extends Action({
  key: "order.cancel",
  actors: [ActorKind.User, ActorKind.Agent],
  tool: true,
}) {
  async handle(input: { orderId: string }, _ctx: ActionContext): Promise<{ id: string }> {
    return { id: input.orderId };
  }
}

class ArchiveOrderAction extends Action({ key: "order.archive", actors: [ActorKind.User] }) {
  async handle(input: { orderId: string }, _ctx: ActionContext): Promise<{ id: string }> {
    return { id: input.orderId };
  }
}

class OrderKpisQuery extends Query({ key: "order.kpis", actors: [ActorKind.User], tool: false }) {
  async handle(_input: object, _ctx: QueryContext): Promise<{ orders: number }> {
    return { orders: 0 };
  }
}

class OrdersSupportSkill extends Skill({
  tools: [GetOrderQuery, ListOrdersQuery, CancelOrderAction],
}) {
  override readonly examples = [
    {
      input: "cancel my last order",
      calls: [
        { tool: ListOrdersQuery, input: { limit: 1 } },
        { tool: CancelOrderAction, input: { orderId: "$0.items[0].id" } },
      ],
    },
  ];
}

describe("Skill", () => {
  it("records the skill kind with its frozen tools", () => {
    const record = kindOf(OrdersSupportSkill);
    expect(record).toEqual({
      kind: "skill",
      options: { tools: [GetOrderQuery, ListOrdersQuery, CancelOrderAction] },
    });
    expect(Object.isFrozen(record?.options["tools"])).toBe(true);
  });

  it("constructs with its examples and stays an instance of its base", () => {
    const skill = new OrdersSupportSkill();
    expect(skill.examples[0]?.calls.map((call) => call.tool)).toEqual([
      ListOrdersQuery,
      CancelOrderAction,
    ]);
    expect(skill).toBeInstanceOf(Skill);
    expectTypeOf(skill.examples).toExtend<readonly SkillExample[]>();
  });

  it("refuses a class that is not an exposed tool", () => {
    expect(() => Skill({ tools: [OrderKpisQuery] })).toThrow(TypeError);
    expect(() => Skill({ tools: [ArchiveOrderAction] })).toThrow(/ArchiveOrderAction/);
    class NotATool {}
    // @ts-expect-error -- a tool is an action or a query class
    expect(() => Skill({ tools: [NotATool] })).toThrow(TypeError);
    // @ts-expect-error -- a tool is a class
    expect(() => Skill({ tools: ["orders.order.get"] })).toThrow(TypeError);
  });

  it("refuses a tool listed twice", () => {
    expect(() => Skill({ tools: [GetOrderQuery, GetOrderQuery] })).toThrow(/once/);
  });

  it("is called only and types its class", () => {
    expectTypeOf(Skill({ tools: [] })).toEqualTypeOf<SkillClass>();
    // @ts-expect-error -- a skill names its tools: Skill({ tools })
    class Bare extends Skill {}
    expect(Bare).toBeTypeOf("function");
  });
});
