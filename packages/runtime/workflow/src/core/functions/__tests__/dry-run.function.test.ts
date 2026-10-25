/**
 * Stackra file contract:
 * Purpose: unit tests of `dryRun`: on a sample input each step says whether it would run, be skipped by its condition
 *          (with the explanation) or wait (with the correlation it would wait on), and the input it would send, later
 *          results left as references; an invalid document is refused before anything is reported.
 * Boundary: test only; pure; the registry is this test file's process state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0122 (decision 3); ADR 0270 (decision 6); ADR 0331 (decision 7).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import type { I18nKey } from "@stackra/i18n";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockKind } from "#core/enums/block-kind.enum";
import { DryRunOutcome } from "#core/enums/dry-run-outcome.enum";
import { AutomationInvalidError } from "#core/errors/automation-invalid.error";
import { dryRun } from "#core/functions/dry-run.function";
import { registerBlocks } from "#core/functions/register-blocks.function";

class OrderPaid extends DomainEvent {
  orderId!: string;
}

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
  { key: "sms.send", kind: BlockKind.Action, type: SendSmsAction, label: "sms::blocks.send" },
]);

const DOCUMENT = {
  key: "commerce.cod_confirmation",
  version: 4,
  trigger: { block: "orders.order_paid" },
  steps: [
    {
      name: "bigOrder",
      block: "sms.send",
      input: { orderId: { $ref: "input.orderId" } },
      when: { field: "trigger.total", operator: Operator.AtLeast, value: 500 },
    },
    { name: "ask", block: "sms.send", input: { orderId: { $ref: "input.orderId" } } },
    { name: "confirm", waitFor: { block: "orders.order_paid", correlate: "input.orderId" } },
    { name: "thank", block: "sms.send", input: { reply: { $ref: "results.confirm.orderId" } } },
  ],
};

const now = new Date("2026-10-25T09:00:00Z");

describe(dryRun, () => {
  it("says what each step would do, with what input", () => {
    const report = dryRun(DOCUMENT, { orderId: "ord_1", total: 120 }, { now });
    expect(report).toMatchObject({ key: "commerce.cod_confirmation", version: 4 });
    expect(report.steps.map((step) => step.outcome)).toEqual([
      DryRunOutcome.Skip,
      DryRunOutcome.Run,
      DryRunOutcome.Wait,
      DryRunOutcome.Run,
    ]);
    expect(report.steps[0]?.evaluation?.matched).toBe(false);
    expect(report.steps[1]?.input).toEqual({ orderId: "ord_1" });
    expect(report.steps[2]?.waitsFor).toEqual({
      block: "orders.order_paid",
      correlate: "input.orderId",
      correlation: "ord_1",
    });
    expect(report.steps[3]?.input).toEqual({ reply: { $ref: "results.confirm.orderId" } });
  });

  it("refuses an invalid document", () => {
    expect(() => dryRun({ ...DOCUMENT, steps: [] }, {}, { now })).toThrow(AutomationInvalidError);
  });
});
