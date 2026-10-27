/**
 * Stackra file contract:
 * Purpose: unit tests of `RestrictedTenderService`: the split follows the program's rule set and tax rule; a terminal
 *          payment presents the restricted part as a `restricted` tender with the program's PIN step, authorise-only
 *          when the program captures at fulfilment; a hosted checkout sends only the eligible lines; capture at
 *          fulfilment re-splits the picked basket, never takes more than was authorised, and voids when nothing is
 *          left; an unknown program, an empty restricted part and a program that captures at sale are refused.
 * Boundary: test only; the services run over the gateway fake, the gateways fake, the memory records and the two
 *           memory drivers, with a fixed clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0445; R3-SO-08.
 */
import { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TenderKind } from "#contracts/enums/tender-kind.enum";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { TenderLine } from "#contracts/types/tender-line.type";
import type { TerminalRequest } from "#contracts/types/terminal-request.type";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { MemoryRestrictedTenderProgramsDriver } from "#core/drivers/memory-restricted-tender-programs.driver";
import { MemoryTenderEligibilityDriver } from "#core/drivers/memory-tender-eligibility.driver";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { NoEligibleLinesError } from "#core/errors/no-eligible-lines.error";
import { RestrictedTenderUnavailableError } from "#core/errors/restricted-tender-unavailable.error";
import { PaymentService } from "#core/services/payment.service";
import { RestrictedTenderService } from "#core/services/restricted-tender.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** A clock that reads a set instant. */
class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-27T10:00:00Z");
  }
}

/** What the gateway was asked. */
interface Seen {
  readonly terminal: TerminalRequest[];
  readonly checkout: CheckoutRequest[];
}

/** Makes `gateway` keep every terminal and checkout request it is asked. */
function recordRequests(gateway: PaymentGatewayFake): Seen {
  const seen: Seen = { terminal: [], checkout: [] };
  const startTerminal = gateway.startTerminal.bind(gateway);
  const checkout = gateway.checkout.bind(gateway);
  gateway.startTerminal = async (request) => {
    seen.terminal.push(request);
    return startTerminal(request);
  };
  gateway.checkout = async (request) => {
    seen.checkout.push(request);
    return checkout(request);
  };
  return seen;
}

const usd = (minor: number): Money => Money.ofMinor(minor, "USD");
const RULE_SET = "rule-set:grocery:tender-eligibility";
const snap = {
  code: "snap",
  ruleSet: RULE_SET,
  taxExempt: true,
  captureAtFulfilment: true,
  pinEntry: true,
};
const voucher = { ...snap, code: "voucher", captureAtFulfilment: false, pinEntry: false };

/** Milk 2 x 1.50 (tax 0.30), soap 4.00 (tax 0.40), bread 2.00 (tax 0.20). */
const lines: readonly TenderLine[] = [
  { name: "Milk", quantity: 2, unitPrice: usd(150), tax: usd(30), category: "dairy" },
  { name: "Soap", quantity: 1, unitPrice: usd(400), tax: usd(40), category: "household" },
  { name: "Bread", quantity: 1, unitPrice: usd(200), tax: usd(20), category: "bakery" },
];

describe("RestrictedTenderService", () => {
  let gateway: PaymentGatewayFake;
  let seen: Seen;
  let payments: PaymentService;
  let tenders: RestrictedTenderService;

  beforeEach(() => {
    gateway = PaymentGatewayFake.with({ provider: "fake", id: "conn_fake" });
    seen = recordRequests(gateway);
    const records = new MemoryPaymentRecordsDriver();
    payments = new PaymentService(
      PaymentGatewaysFake.with([gateway]),
      records,
      new FixedClock(),
      ConnectedAccountLimitsFake.with(),
    );
    tenders = new RestrictedTenderService(
      payments,
      new MemoryRestrictedTenderProgramsDriver().offer("us", snap).offer("us", voucher),
      new MemoryTenderEligibilityDriver().allow(RULE_SET, "dairy", "bakery"),
      records,
    );
  });

  it("splits by the program's rule set and tax rule", async () => {
    const split = await tenders.split("us", "snap", lines);
    expect(split.restricted.minor).toBe(500);
    expect(split.waivedTax.minor).toBe(50);
    expect(split.remainder.minor).toBe(440);
    expect(split.eligible).toEqual([0, 2]);
  });

  it("presents the restricted part on the terminal with the PIN step, authorise-only for capture at fulfilment", async () => {
    const { split, session } = await tenders.startTerminal("us", {
      reference: "ebt_1",
      terminalId: "tmr_1",
      program: "snap",
      lines,
    });
    expect(session.status).toBe(PaymentStatus.Pending);
    expect(seen.terminal[0]).toMatchObject({
      amount: split.restricted,
      tender: TenderKind.Restricted,
      program: "snap",
      pinEntry: true,
      captureLater: true,
    });
    await tenders.startTerminal("us", {
      reference: "mv_1",
      terminalId: "tmr_1",
      program: "voucher",
      lines,
    });
    expect(seen.terminal[1]).toMatchObject({ pinEntry: false, captureLater: false });
  });

  it("opens a hosted checkout with the eligible lines only", async () => {
    await tenders.checkout("us", {
      reference: "ebt_2",
      program: "snap",
      lines,
      description: "Order 2",
      returnUrl: "https://shop.example/ok",
      cancelUrl: "https://shop.example/no",
    });
    expect(seen.checkout[0]?.lines?.map((line) => line.name)).toEqual(["Milk", "Bread"]);
    expect(seen.checkout[0]).toMatchObject({
      amount: usd(500),
      tender: TenderKind.Restricted,
      program: "snap",
      captureLater: true,
    });
  });

  it("captures the picked basket at fulfilment, never above the authorisation", async () => {
    const { session } = await tenders.startTerminal("us", {
      reference: "ebt_3",
      terminalId: "tmr_1",
      program: "snap",
      lines,
    });
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    await payments.reconcile("ebt_3");
    const picked = lines.slice(0, 2);
    const { split, record } = await tenders.captureAtFulfilment("us", {
      reference: "ebt_3",
      program: "snap",
      lines: picked,
    });
    expect(split.restricted.minor).toBe(300);
    expect(record.status).toBe(PaymentStatus.Captured);
  });

  it("voids when the picked basket has nothing eligible", async () => {
    const { session } = await tenders.startTerminal("us", {
      reference: "ebt_4",
      terminalId: "tmr_1",
      program: "snap",
      lines,
    });
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    await payments.reconcile("ebt_4");
    const soap = lines.filter((line) => line.category === "household");
    const { record } = await tenders.captureAtFulfilment("us", {
      reference: "ebt_4",
      program: "snap",
      lines: soap,
    });
    expect(record.status).toBe(PaymentStatus.Voided);
  });

  it("refuses an unknown program, nothing to pay, a sale-time program and a missing record", async () => {
    await expect(tenders.split("eu", "snap", lines)).rejects.toRefuseWith(
      refusal(RestrictedTenderUnavailableError),
    );
    const soap = lines.filter((line) => line.category === "household");
    await expect(
      tenders.startTerminal("us", {
        reference: "x",
        terminalId: "t",
        program: "snap",
        lines: soap,
      }),
    ).rejects.toRefuseWith(refusal(NoEligibleLinesError));
    await tenders.startTerminal("us", {
      reference: "mv_2",
      terminalId: "tmr_1",
      program: "voucher",
      lines,
    });
    await expect(
      tenders.captureAtFulfilment("us", { reference: "mv_2", program: "voucher", lines }),
    ).rejects.toRefuseWith(refusal(InvalidPaymentTransitionError));
    await expect(
      tenders.captureAtFulfilment("us", { reference: "none", program: "snap", lines }),
    ).rejects.toRefuseWith(refusal(NotFoundError));
  });
});
