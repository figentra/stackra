/**
 * Stackra file contract:
 * Purpose: unit tests of `OutcomeDispatcher`: `create` needs one handler per registered kind and no other; `dispatch`
 *          calls each outcome's handler in order with its guarded parameters and the context, and returns what they
 *          gave; a decision that did not match dispatches nothing.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0331 (decision 9).
 */
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { FieldType, Operator } from "#contracts/index";
import { decide } from "#core/functions/decide.function";
import { OutcomeDispatcher } from "#core/values/outcome-dispatcher.value";
import { Rules } from "#core/values/rules.value";

const label = "shop::label" as I18nKey;

const RULES = Rules.create({
  key: "shop.orders",
  sources: [{ key: "order", fields: { items: { type: FieldType.Number, label } } }],
  outcomes: [
    { key: "hold", label, params: { reason: { type: FieldType.String, label } } },
    { key: "notify", label, params: {} },
  ],
});

/** An order the handlers write to. */
interface Order {
  readonly log: string[];
}

describe(OutcomeDispatcher, () => {
  it("needs exactly one handler per kind", () => {
    expect(() => OutcomeDispatcher.create(RULES, { hold: () => undefined })).toThrow(
      /no handler for notify/,
    );
    expect(() =>
      OutcomeDispatcher.create(RULES, {
        hold: () => undefined,
        notify: () => undefined,
        wrap: () => undefined,
      }),
    ).toThrow(/no outcome kind wrap/);
  });

  it("applies each outcome in order with the context", async () => {
    const dispatcher = OutcomeDispatcher.create(RULES, {
      hold: (params, order: Order) => order.log.push(`hold:${String(params["reason"])}`),
      notify: async (_params, order: Order) => order.log.push("notify"),
    });
    const rule = {
      condition: { field: "order.items", operator: Operator.AtLeast, value: 1 },
      outcomes: [
        { kind: "hold", params: { reason: "review" } },
        { kind: "notify", params: {} },
      ],
    };
    const order: Order = { log: [] };
    const now = new Date("2026-10-25T09:00:00Z");
    const results = await dispatcher.dispatch(
      decide(RULES, rule, { order: { items: 3 } }, { now, floors: [] }),
      order,
    );
    expect(order.log).toEqual(["hold:review", "notify"]);
    expect(results).toEqual([1, 2]);
    expect(
      await dispatcher.dispatch(
        decide(RULES, rule, { order: { items: 0 } }, { now, floors: [] }),
        order,
      ),
    ).toEqual([]);
  });
});
