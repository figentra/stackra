/**
 * Stackra file contract:
 * Purpose: unit tests of `runDisputeCase`: read, respond and accept on the gateway fake pass what was recorded; another
 *          dispute answered, a step ending in a state it cannot, an empty reason, a non-positive amount, an invalid due
 *          date and every recorded field that differs are reported; a recorded lost answer passes; a respond case
 *          without evidence and a non-refusal error throw.
 * Boundary: test only; the gateway fake and an in-file scripted gateway, no vendor.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0357 (Enforcement: the dispute port); ADR 0443 (decision 8); owner decision D3
 *                     (2026-10-27).
 */
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { DisputeStatus } from "#contracts/enums/dispute-status.enum";
import type { Dispute } from "#contracts/types/dispute.type";
import type { DisputeGateway } from "#contracts/types/dispute-gateway.type";
import type { DisputeCase } from "#testing/dispute-case.type";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { runDisputeCase } from "#testing/run-dispute-case.function";

const amount = Money.ofMinor(5000, "SAR");

/** The fake with payment `fake_ord_1` disputed as `dp_1`. */
async function disputed(): Promise<PaymentGatewayFake> {
  const gateway = PaymentGatewayFake.with();
  await gateway.checkout({
    reference: "ord_1",
    amount,
    description: "Order 1",
    returnUrl: "https://shop.example/ok",
    cancelUrl: "https://shop.example/cancel",
  });
  gateway.openDispute("dp_1", "fake_ord_1");
  return gateway;
}

/** A gateway answering `answer` to every call, or throwing what it returns when it is a function. */
const scripted = (answer: Dispute | (() => never)): DisputeGateway => {
  const reply = async (): Promise<Dispute> => (typeof answer === "function" ? answer() : answer);
  return { dispute: reply, respond: reply, accept: reply };
};

const recorded = (step: DisputeCase["step"], expected: DisputeCase["expect"]): DisputeCase => ({
  id: `fake.dispute-${step}`,
  source: "the in-repo gateway fake",
  certification: "pending",
  step,
  providerRef: "dp_1",
  evidence: { text: "Delivered and signed for." },
  expect: expected,
});

const opened: Dispute = {
  providerRef: "dp_1",
  paymentRef: "fake_ord_1",
  amount,
  reason: "fraudulent",
  status: DisputeStatus.NeedsResponse,
};

describe("runDisputeCase", () => {
  it("passes read, respond and accept that answer what was recorded", async () => {
    const gateway = await disputed();
    const read = await runDisputeCase(
      gateway,
      recorded("read", {
        status: DisputeStatus.NeedsResponse,
        paymentRef: "fake_ord_1",
        amount,
        reason: "fraudulent",
      }),
    );
    expect(read.mismatches).toEqual([]);
    expect(
      (await runDisputeCase(gateway, recorded("respond", { status: DisputeStatus.UnderReview })))
        .mismatches,
    ).toEqual([]);
    expect(
      (await runDisputeCase(gateway, recorded("accept", { status: DisputeStatus.Accepted })))
        .mismatches,
    ).toEqual([]);
  });

  it("reports another dispute, a step's impossible end and broken fields", async () => {
    const gateway = scripted({
      ...opened,
      providerRef: "dp_2",
      reason: "",
      amount: Money.zero("SAR"),
      respondBy: new Date(Number.NaN),
    });
    expect((await runDisputeCase(gateway, recorded("respond", {}))).mismatches).toEqual([
      "providerRef: asked dp_1, got dp_2",
      "status: respond cannot end needs_response",
      "reason: empty",
      "amount: not positive",
      "respondBy: not a valid time",
    ]);
  });

  it("reports every recorded field that differs", async () => {
    const { mismatches } = await runDisputeCase(
      scripted(opened),
      recorded("read", {
        status: DisputeStatus.Won,
        paymentRef: "pay_9",
        amount: Money.ofMinor(4000, "SAR"),
        reason: "not_received",
        respondBy: new Date("2026-11-10T00:00:00Z"),
      }),
    );
    expect(mismatches).toEqual([
      "status: expected won, got needs_response",
      "paymentRef: expected pay_9, got fake_ord_1",
      "amount: expected 4000 SAR, got 5000 SAR",
      "reason: expected not_received, got fraudulent",
      "respondBy: expected 2026-11-10T00:00:00.000Z, got none",
    ]);
  });

  it("accepts a provider that closes an accepted dispute as lost", async () => {
    const gateway = scripted({ ...opened, status: DisputeStatus.Lost });
    expect((await runDisputeCase(gateway, recorded("accept", {}))).mismatches).toEqual([]);
  });

  it("passes a recorded lost answer and reports an unrecorded one", async () => {
    const lost = (await disputed()).loseNext();
    expect((await runDisputeCase(lost, recorded("accept", { lost: true }))).mismatches).toEqual([]);
    const again = (await disputed()).loseNext();
    expect((await runDisputeCase(again, recorded("accept", {}))).mismatches).toEqual([
      "refused: provider_unavailable (no outage was recorded)",
    ]);
  });

  it("throws on a respond case without evidence and on a non-refusal error", async () => {
    await expect(
      runDisputeCase(scripted(opened), {
        id: "fake.dispute-respond",
        source: "the in-repo gateway fake",
        certification: "pending",
        step: "respond",
        providerRef: "dp_1",
        expect: {},
      }),
    ).rejects.toThrow("responds without evidence");
    const broken = scripted(() => {
      throw new TypeError("gateway bug");
    });
    await expect(runDisputeCase(broken, recorded("read", {}))).rejects.toThrow("gateway bug");
  });
});
