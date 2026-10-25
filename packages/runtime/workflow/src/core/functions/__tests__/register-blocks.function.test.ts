/**
 * Stackra file contract:
 * Purpose: unit tests of the building-block registry: `registerBlocks` registers triggers and actions by key and
 *          refuses a bad key, a class of the wrong kind, a key another class holds, facts on an action and a
 *          misdeclared fact; `buildingBlocks` lists them, all or of one kind; `triggerRules` and `factsOf` read a
 *          trigger's facts (a date from its ISO text, or through the block's own `read`).
 * Boundary: test only; the registry is this test file's process state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0153 (decision 1); ADR 0122 (decision 3); ADR 0331 (decision 4).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import type { I18nKey } from "@stackra/i18n";
import { FieldType } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockKind } from "#core/enums/block-kind.enum";
import { buildingBlocks } from "#core/functions/building-blocks.function";
import { factsOf } from "#core/functions/facts-of.function";
import { registerBlocks } from "#core/functions/register-blocks.function";
import { triggerRules } from "#core/functions/trigger-rules.function";

const label = "orders::facts.total" as I18nKey;

class OrderPaid extends DomainEvent {
  orderId!: string;
}

class OrderShipped extends DomainEvent {}

class SendSmsAction extends Action({ key: "sms.send", actors: [ActorKind.System] }) {
  async handle(): Promise<void> {}
}

const PAID = {
  key: "orders.order_paid",
  kind: BlockKind.Trigger,
  type: OrderPaid,
  label: "orders::blocks.order_paid",
  facts: {
    total: { type: FieldType.Number, label },
    paidAt: { type: FieldType.Date, label },
  },
  correlate: (event: OrderPaid) => event.orderId,
};

const SMS = {
  key: "sms.send",
  kind: BlockKind.Action,
  type: SendSmsAction,
  label: "sms::blocks.send",
};

describe(registerBlocks, () => {
  it("registers triggers and actions, and lists them", () => {
    registerBlocks([PAID, SMS]);
    expect(buildingBlocks().map((block) => block.key)).toEqual(["orders.order_paid", "sms.send"]);
    expect(buildingBlocks(BlockKind.Action).map((block) => block.type)).toEqual([SendSmsAction]);
  });

  it("refuses a bad key, a wrong class, a taken key, facts on an action and a bad fact", () => {
    expect(() => registerBlocks([{ ...SMS, key: "send" }])).toThrow(/is not a key/);
    expect(() => registerBlocks([{ ...SMS, type: OrderPaid }])).toThrow(/is not a action/);
    expect(() => registerBlocks([{ ...PAID, type: OrderShipped }])).toThrow(
      /share orders.order_paid/,
    );
    expect(() => registerBlocks([{ ...SMS, key: "sms.other", facts: PAID.facts }])).toThrow(
      /only a trigger has facts/,
    );
    expect(() =>
      registerBlocks([
        {
          ...PAID,
          key: "orders.order_paid_again",
          facts: { "bad-key": { type: FieldType.Number, label } },
        },
      ]),
    ).toThrow(TypeError);
  });

  it("reads a trigger's facts for its rules", () => {
    registerBlocks([PAID]);
    expect(triggerRules(PAID).fieldOf("trigger.total")?.type).toBe(FieldType.Number);
    expect(triggerRules(PAID)).toBe(triggerRules(PAID));
    expect(factsOf(PAID, { total: 120, paidAt: "2026-10-25T09:00:00Z", other: 1 })).toEqual({
      trigger: { total: 120, paidAt: new Date("2026-10-25T09:00:00Z") },
    });
    expect(factsOf({ ...PAID, read: () => ({ total: 7 }) }, {})).toEqual({ trigger: { total: 7 } });
    expect(() => triggerRules(SMS)).toThrow(/declares no facts/);
  });
});
