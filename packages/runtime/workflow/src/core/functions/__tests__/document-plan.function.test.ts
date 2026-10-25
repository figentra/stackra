/**
 * Stackra file contract:
 * Purpose: unit tests of `documentPlan`: a document compiles to the engine's graph format under the document key and
 *          its version, with each step's retries, wait (the awaited block's key and the correlation read from the run)
 *          and timeout, and a condition evaluated over the trigger's facts at the run's start; a block this process
 *          does not register throws.
 * Boundary: test only; pure; the registry is this test file's process state.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0152 (decisions 2 and 5).
 */
import { Action } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { DomainEvent } from "@stackra/events";
import type { I18nKey } from "@stackra/i18n";
import { Backoff } from "@stackra/queue";
import { FieldType, Operator } from "@stackra/rules/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BlockKind } from "#core/enums/block-kind.enum";
import { checkAutomation } from "#core/functions/check-automation.function";
import { documentPlan } from "#core/functions/document-plan.function";
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

const DOCUMENT = checkAutomation({
  key: "commerce.cod_confirmation",
  version: 2,
  timeout: "1d",
  trigger: { block: "orders.order_paid" },
  steps: [
    {
      name: "ask",
      block: "sms.send",
      retry: { attempts: 3, backoff: Backoff.Fixed },
      timeout: "30s",
      when: { field: "trigger.total", operator: Operator.AtLeast, value: 100 },
    },
    {
      name: "confirm",
      waitFor: { block: "orders.order_paid", correlate: "input.orderId", timeout: "2h" },
    },
  ],
});

/** A document run's view with `input`. */
const viewOf = (input: object) => ({
  id: "wfr_1",
  input: { document: DOCUMENT, input },
  results: {},
  startedAt: new Date("2026-10-25T09:00:00Z"),
});

describe(documentPlan, () => {
  it("compiles the document to the engine's plan", () => {
    const plan = documentPlan(DOCUMENT);
    expect(plan).toMatchObject({ key: "workflow.document", version: 2, timeout: 86_400_000 });
    const [ask, confirm] = plan.steps;
    expect(ask).toMatchObject({
      name: "ask",
      attempts: 3,
      backoff: Backoff.Fixed,
      timeout: 30_000,
    });
    expect(ask?.when?.(viewOf({ total: 150 }) as never)).toBe(true);
    expect(ask?.when?.(viewOf({ total: 50 }) as never)).toBe(false);
    expect(confirm).toMatchObject({ waitFor: OrderPaid, signal: "OrderPaid", timeout: 7_200_000 });
    expect(confirm?.correlate?.(viewOf({ orderId: "ord_1" }) as never)).toBe("ord_1");
  });

  it("throws for a block this process does not register", () => {
    expect(() =>
      documentPlan({ ...DOCUMENT, steps: [{ name: "mail", block: "mail.send", input: {} }] }),
    ).toThrow(/no building block mail.send/);
  });
});
