/**
 * Stackra file contract:
 * Purpose: unit tests of `checkAutomation` and the shape it parses (`AUTOMATION_DOCUMENT_SCHEMA`): a valid document
 *          comes back with its defaults (version 1, empty inputs); a bad shape is refused path by path; an unknown or
 *          wrong-kind block, a wait on a trigger that does not correlate, a reference to a later step or to an event
 *          outside a wait, and a condition without facts or with an unregistered field are each refused by path.
 * Boundary: test only; the registry is this test file's process state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0122 (decision 3 and its enforcement); ADR 0331 (decision 10); ADR 0245 (decision
 *                     8).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import { isRefusal } from "@stackra/errors";
import type { I18nKey } from "@stackra/i18n";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockKind } from "#core/enums/block-kind.enum";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { checkAutomation } from "#core/functions/check-automation.function";
import { registerBlocks } from "#core/functions/register-blocks.function";

class OrderPaid extends DomainEvent {
  orderId!: string;
}

class CodConfirmed extends DomainEvent {}

class SendSmsAction extends Action({ key: "sms.send", actors: [ActorKind.System] }) {
  async handle(): Promise<void> {}
}

registerBlocks([
  {
    key: "orders.order_paid",
    kind: BlockKind.Trigger,
    type: OrderPaid,
    label: "orders::blocks.order_paid",
    facts: { total: { type: FieldType.Number, label: "orders::facts.total" as I18nKey } },
    correlate: (event: OrderPaid) => event.orderId,
  },
  {
    key: "orders.cod_confirmed",
    kind: BlockKind.Trigger,
    type: CodConfirmed,
    label: "orders::blocks.cod",
  },
  { key: "sms.send", kind: BlockKind.Action, type: SendSmsAction, label: "sms::blocks.send" },
]);

/** The field errors `document` is refused with. */
function refusal(document: unknown): Readonly<Record<string, string>> {
  try {
    checkAutomation(document);
  } catch (error) {
    if (isRefusal(error, AutomationInvalidError)) return error.fieldErrors ?? {};
    throw error;
  }
  throw new Error("the document was not refused");
}

const VALID = {
  key: "commerce.cod_confirmation",
  trigger: { block: "orders.order_paid" },
  steps: [
    {
      name: "ask",
      block: "sms.send",
      input: { orderId: { $ref: "input.orderId" } },
      when: { field: "trigger.total", operator: Operator.AtLeast, value: 100 },
    },
    {
      name: "confirm",
      waitFor: { block: "orders.order_paid", correlate: "input.orderId", timeout: "2h" },
    },
    { name: "thank", block: "sms.send", input: { reply: { $ref: "results.confirm.orderId" } } },
  ],
};

describe(checkAutomation, () => {
  it("returns a valid document with its defaults", () => {
    const document = checkAutomation(VALID);
    expect(document.version).toBe(1);
    expect(document.steps[1]?.input).toEqual({});
  });

  it("refuses a bad shape by path", () => {
    expect(refusal({ ...VALID, steps: [] })).toEqual({ steps: "shape_invalid" });
    expect(refusal({ ...VALID, steps: [{ name: "idle" }] })).toHaveProperty("steps.0.block");
    expect(refusal({ ...VALID, steps: [...VALID.steps, VALID.steps[0]] })).toHaveProperty("steps");
  });

  it("refuses unknown and wrong-kind blocks and a wait that cannot correlate", () => {
    expect(
      refusal({
        key: "commerce.bad",
        trigger: { block: "sms.send" },
        steps: [
          { name: "a", block: "orders.order_paid" },
          { name: "b", block: "mail.send" },
          { name: "c", waitFor: { block: "orders.cod_confirmed", correlate: "input.orderId" } },
        ],
      }),
    ).toEqual({
      "trigger.block": "block_not_trigger",
      "steps.0.block": "block_not_action",
      "steps.1.block": "block_unknown",
      "steps.2.waitFor.block": "block_not_waitable",
    });
  });

  it("refuses forward and misplaced references", () => {
    expect(
      refusal({
        key: "commerce.bad",
        steps: [
          {
            name: "a",
            block: "sms.send",
            input: { x: { $ref: "results.b.id" }, y: { $ref: "event.id" } },
          },
          { name: "b", block: "sms.send", input: { z: { $ref: "nowhere.id" } } },
        ],
      }),
    ).toEqual({
      "steps.0.input.x": "ref_forward",
      "steps.0.input.y": "ref_invalid",
      "steps.1.input.z": "ref_invalid",
    });
  });

  it("refuses a condition without facts, or naming an unregistered field", () => {
    const when = { field: "trigger.total", operator: Operator.AtLeast, value: 1 };
    expect(
      refusal({ key: "commerce.plan", steps: [{ name: "a", block: "sms.send", when }] }),
    ).toEqual({ "steps.0.when": "when_without_facts" });
    expect(
      refusal({
        ...VALID,
        steps: [{ name: "a", block: "sms.send", when: { ...when, field: "trigger.missing" } }],
      }),
    ).toEqual({ "steps.0.when": "when_invalid" });
  });
});
