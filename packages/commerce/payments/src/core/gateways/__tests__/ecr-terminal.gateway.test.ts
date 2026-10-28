/**
 * Stackra file contract:
 * Purpose: recorded-fixture tests of `EcrTerminalGateway`: capabilities follow the profile, a sale sends the
 *          tip prompt and reads the tip, result codes map to states (an unlisted one is `unknown`), a lost answer is
 *          `ProviderUnavailableError`, a cancel goes beside the running sale and the inquiry reconciles, refunds,
 *          pre-authorisation with completion and void, and the whole cancel-then-reconcile path through
 *          `PaymentService`.
 * Boundary: test only; `EcrLinkFake` replays recorded answer text. The profile is an illustrative fixture shaped like
 *           the public descriptions of the Geidea and Network International ECR integrations (purchase, refund, void,
 *           last-transaction inquiry), not a certified layout: certification pending.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0377 (decisions 1 to 4); ADR 0357 (decision 6).
 */
import { Clock } from "@stackra/contracts";
import { refusal } from "@stackra/errors/testing";
import { ProviderUnavailableError } from "@stackra/integrations";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { EcrOutcome } from "#contracts/enums/ecr-outcome.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TransferStatus } from "#contracts/enums/transfer-status.enum";
import type { EcrProfile } from "#contracts/types/ecr-profile.type";
import { EcrTerminalGateway } from "#core/gateways/ecr-terminal.gateway";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { EcrLinkFake } from "#testing/ecr-link.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** An illustrative profile (certification pending). */
const profile: EcrProfile = {
  provider: "geidea",
  certification: "pending",
  operations: {
    sale: "PUR",
    refund: "REF",
    inquiry: "INQ",
    cancel: "CAN",
    authorize: "AUT",
    completion: "CMP",
    void: "VOD",
  },
  separator: "|",
  request: [
    "operation",
    "reference",
    "amount",
    "currency",
    "terminal",
    "provider_ref",
    "tip_percentages",
    "tip_custom",
  ],
  response: ["operation", "reference", "result", "provider_ref", "amount", "tip"],
  results: {
    "00": EcrOutcome.Approved,
    "05": EcrOutcome.Declined,
    "17": EcrOutcome.Cancelled,
    P: EcrOutcome.Pending,
  },
  timing: { answerMs: 120_000, ackMs: 2000, retries: 3 },
};

const amount = Money.ofMinor(2500, "SAR");
const sale = { reference: "chk_9", terminalId: "T-0042", amount };

/** Lets queued microtasks and timers run, so the held exchange has started. */
function tick(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** A gateway over `link`, with `overrides` on the profile. */
function gatewayOver(link: EcrLinkFake, overrides: Partial<EcrProfile> = {}): EcrTerminalGateway {
  return new EcrTerminalGateway({
    id: "till-1",
    profile: { ...profile, ...overrides },
    link,
    currency: "SAR",
  });
}

describe("EcrTerminalGateway", () => {
  it("derives its capabilities from the profile", () => {
    expect(gatewayOver(new EcrLinkFake()).capabilities).toEqual([
      PaymentCapability.Terminal,
      PaymentCapability.TerminalTips,
      PaymentCapability.Capture,
    ]);
    const plain = gatewayOver(new EcrLinkFake(), {
      operations: { sale: "PUR", refund: "REF", inquiry: "INQ", cancel: "CAN" },
      request: ["operation", "reference", "amount"],
    });
    expect(plain.capabilities).toEqual([PaymentCapability.Terminal]);
    expect(plain.provider).toBe("geidea");
  });

  it("sends the tip prompt and reads the tip the customer chose", async () => {
    const link = EcrLinkFake.answering("PUR|chk_9|00|RRN-1|2750|250");
    const session = await gatewayOver(link).startTerminal({
      ...sale,
      tipPrompt: { percentages: [10, 15, 20], custom: true },
    });
    expect(link.calls).toEqual([
      {
        kind: "exchange",
        payload: "PUR|chk_9|2500|SAR|T-0042||10,15,20|1",
        timing: profile.timing,
      },
    ]);
    expect(session).toEqual({
      providerRef: "RRN-1",
      terminalId: "T-0042",
      status: PaymentStatus.Captured,
      tip: Money.ofMinor(250, "SAR"),
    });
  });

  it("maps declined, cancelled and unlisted result codes", async () => {
    const link = EcrLinkFake.answering("PUR|a|05|R1|2500|0", "PUR|b|17||2500|", "PUR|c|ZZ|R3||");
    const gateway = gatewayOver(link);
    expect((await gateway.startTerminal({ ...sale, reference: "a" })).status).toBe(
      PaymentStatus.Failed,
    );
    expect((await gateway.startTerminal({ ...sale, reference: "b" })).status).toBe(
      PaymentStatus.Voided,
    );
    expect((await gateway.startTerminal({ ...sale, reference: "c" })).status).toBe(
      PaymentStatus.Unknown,
    );
  });

  it("turns a lost answer into ProviderUnavailableError", async () => {
    const gateway = gatewayOver(new EcrLinkFake().lose());
    await expect(gateway.startTerminal(sale)).rejects.toRefuseWith(
      refusal(ProviderUnavailableError, { provider: "geidea" }),
    );
  });

  it("cancels beside the running sale, then reads the cancelled answer", async () => {
    const link = new EcrLinkFake().hold();
    const gateway = gatewayOver(link);
    const running = gateway.startTerminal(sale);
    await tick();
    await gateway.cancelTerminal("T-0042");
    expect(link.calls.at(-1)).toEqual({
      kind: "signal",
      payload: "CAN|chk_9|||T-0042|||",
      timing: profile.timing,
    });
    link.release("PUR|chk_9|17|||");
    expect((await gateway.lookup({ reference: "chk_9" }))?.status).toBe(PaymentStatus.Voided);
    expect((await running).status).toBe(PaymentStatus.Voided);
  });

  it("sends nothing to cancel on an idle terminal, and refuses an unacknowledged cancel", async () => {
    const link = new EcrLinkFake().hold();
    const gateway = gatewayOver(link);
    await gateway.cancelTerminal("T-0042");
    expect(link.calls).toEqual([]);
    void gateway.startTerminal(sale);
    await tick();
    link.isSignalLost = true;
    await expect(gateway.cancelTerminal("T-0042")).rejects.toRefuseWith(
      refusal(ProviderUnavailableError),
    );
  });

  it("reconciles by the last-transaction inquiry", async () => {
    const link = EcrLinkFake.answering(
      "PUR|chk_9|00|RRN-1|2500|",
      "AUT|other|00|RRN-2|900|",
      "||05|||",
    );
    const gateway = gatewayOver(link);
    expect(await gateway.lookup({ reference: "chk_9" })).toEqual({
      providerRef: "RRN-1",
      status: PaymentStatus.Captured,
      amount,
    });
    expect(link.calls[0]?.payload).toBe("INQ|chk_9||||||");
    await expect(gateway.lookup({ reference: "chk_10" })).rejects.toRefuseWith(
      refusal(ProviderUnavailableError),
    );
    expect(await gateway.lookup({ reference: "chk_11" })).toBeNull();
    expect(await gateway.terminalSession("RRN-1", "T-0042")).toEqual({
      providerRef: "RRN-1",
      terminalId: "T-0042",
      status: PaymentStatus.Captured,
    });
  });

  it("refunds on the terminal against the original payment", async () => {
    const link = EcrLinkFake.answering(
      "REF|rf_1|00|RRN-9|1000|",
      "REF|rf_2|05|||",
      "REF|rf_3|ZZ|||",
    );
    const gateway = gatewayOver(link);
    const payment = { reference: "chk_9", providerRef: "RRN-1" };
    const refund = { payment, amount: Money.ofMinor(1000, "SAR") };
    expect(await gateway.refund({ ...refund, reference: "rf_1" })).toEqual({
      providerRef: "RRN-9",
      status: TransferStatus.Succeeded,
    });
    expect(link.calls[0]?.payload).toBe("REF|rf_1|1000|SAR||RRN-1||");
    expect((await gateway.refund({ ...refund, reference: "rf_2" })).status).toBe(
      TransferStatus.Failed,
    );
    await expect(gateway.refund({ ...refund, reference: "rf_3" })).rejects.toRefuseWith(
      refusal(ProviderUnavailableError),
    );
  });

  it("authorises, completes and voids where the profile has the codes", async () => {
    const link = EcrLinkFake.answering(
      "AUT|tab_1|00|RRN-5|5000|",
      "CMP|tab_1|00|RRN-5|4200|",
      "AUT|tab_2|00|RRN-6|5000|",
      "VOD|tab_2|00|RRN-6||",
    );
    const gateway = gatewayOver(link);
    const hold = { ...sale, amount: Money.ofMinor(5000, "SAR"), captureLater: true };
    expect((await gateway.startTerminal({ ...hold, reference: "tab_1" })).status).toBe(
      PaymentStatus.Authorized,
    );
    const captured = await gateway.capture({
      payment: { reference: "tab_1", providerRef: "RRN-5" },
      amount: Money.ofMinor(4200, "SAR"),
      reference: "capture:tab_1",
    });
    expect(captured).toMatchObject({ status: PaymentStatus.Captured, amount: { minor: 4200 } });
    await gateway.startTerminal({ ...hold, reference: "tab_2" });
    const voided = await gateway.void({ reference: "tab_2", providerRef: "RRN-6" });
    expect(voided).toMatchObject({ status: PaymentStatus.Voided, amount: { minor: 5000 } });
    const plain = gatewayOver(new EcrLinkFake(), {
      operations: { sale: "PUR", refund: "REF", inquiry: "INQ", cancel: "CAN" },
    });
    await expect(plain.startTerminal(hold)).rejects.toRefuseWith(
      refusal(CapabilityUnsupportedError, { provider: "geidea", capability: "capture" }),
    );
  });

  it("has no hosted checkout", async () => {
    await expect(gatewayOver(new EcrLinkFake()).checkout()).rejects.toRefuseWith(
      refusal(CapabilityUnsupportedError, { provider: "geidea", capability: "checkout" }),
    );
  });

  it("takes PaymentService from a lost answer to the reconciled state", async () => {
    class FixedClock extends Clock {
      now(): Date {
        return new Date("2026-10-27T10:00:00Z");
      }
    }
    const link = new EcrLinkFake().lose().answer("PUR|chk_9|00|RRN-1|2500|");
    const records = new MemoryPaymentRecordsDriver();
    const payments = new PaymentService(
      PaymentGatewaysFake.with([gatewayOver(link)]),
      records,
      new FixedClock(),
      ConnectedAccountLimitsFake.with(),
    );
    await expect(payments.startTerminal("sa", sale)).rejects.toThrow();
    expect((await records.find("chk_9"))?.status).toBe(PaymentStatus.Unknown);
    expect((await payments.reconcile("chk_9")).status).toBe(PaymentStatus.Captured);
  });
});
