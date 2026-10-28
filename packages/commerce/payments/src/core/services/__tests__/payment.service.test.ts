/**
 * Stackra file contract:
 * Purpose: unit tests of `PaymentService`: a checkout is reused while open and refused once paid; a lost answer makes
 *          the payment `unknown`, which blocks every action until `reconcile` looks it up (so a retried charge never
 *          charges twice) or a manager resolves it with a reason; a merchant-initiated charge needs the token's flag;
 *          capture and refunds move the state and never refund more than was taken; a provider without capture is
 *          refused; a terminal payment keeps its tip, a cancel reads the final state and voids only the session it names; a pay link is reused until
 *          it expires. On a connected account only, a payment above the pre-verification cap and a held payout are
 *          refused; other modes never ask for limits; the account's payment methods are read when the provider reports
 *          them. A terminal PIN step, a restricted tender or a SoftPos session is served only by a provider with that
 *          capability. An agent payment is taken only within the shopper's wallet confirmation (missing, another cart,
 *          expired or too small is refused), is tagged with its protocol and agent, and is never taken twice. A saved
 *          token is pre-authorised, its hold raised (a retried increment counted once), captured in part or released;
 *          a provider without pre-authorisation or increments is refused.
 * Boundary: test only; the service runs over the gateway fake, the gateways fake, the memory records and a fixed
 *           clock.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decisions 2, 5 and 6); ADR 0445; ADR 0446; STA-1024.
 */
import { Clock } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { ConnectionMode } from "#contracts/enums/connection-mode.enum";
import { PaymentCapability } from "#contracts/enums/payment-capability.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { TenderKind } from "#contracts/enums/tender-kind.enum";
import { MemoryAgentCommerceProtocolsDriver } from "#core/drivers/memory-agent-commerce-protocols.driver";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { AgentConfirmationRefusedError } from "#core/errors/agent-confirmation-refused.error";
import { CapabilityUnsupportedError } from "#core/errors/capability-unsupported.error";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { MerchantInitiatedNotAllowedError } from "#core/errors/merchant-initiated-not-allowed.error";
import { NoPaymentProviderError } from "#core/errors/no-payment-provider.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { PayoutHeldError } from "#core/errors/payout-held.error";
import { PreVerificationCapExceededError } from "#core/errors/pre-verification-cap-exceeded.error";
import { ResolutionReasonRequiredError } from "#core/errors/resolution-reason-required.error";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

/** A clock that reads a set instant. */
class FixedClock extends Clock {
  at = new Date("2026-10-25T10:00:00Z");

  now(): Date {
    return new Date(this.at);
  }
}

const amount = Money.ofMinor(10_000, "SAR");
const request = {
  reference: "ord_1",
  amount,
  description: "Order 1",
  returnUrl: "https://shop.example/ok",
  cancelUrl: "https://shop.example/no",
};
/** The refusal of the agent payment of `cart_1` for `reason`. */
function refused(reason: string) {
  return refusal(AgentConfirmationRefusedError, { reference: "cart_1", protocol: "acp", reason });
}

const method = {
  provider: "fake",
  connectionId: "conn_fake",
  token: "tok_1",
  merchantInitiated: false,
};

describe("PaymentService", () => {
  let gateway: PaymentGatewayFake;
  let records: MemoryPaymentRecordsDriver;
  let clock: FixedClock;
  let payments: PaymentService;

  beforeEach(() => {
    gateway = PaymentGatewayFake.with();
    records = new MemoryPaymentRecordsDriver();
    clock = new FixedClock();
    payments = new PaymentService(
      PaymentGatewaysFake.with([gateway]),
      records,
      clock,
      ConnectedAccountLimitsFake.with(),
    );
  });

  it("reuses an open checkout and refuses one that was paid", async () => {
    const session = await payments.checkout("m1", { ...request, tip: Money.ofMinor(500, "SAR") });
    expect(await payments.checkout("m1", request)).toEqual(session);
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Pending,
      tip: { minor: 500 },
      provider: "fake",
    });
    gateway.settle(session.providerRef, PaymentStatus.Captured);
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(InvalidPaymentTransitionError, {
        reference: "ord_1",
        status: "captured",
        operation: "checkout",
      }),
    );
  });

  it("makes a lost answer unknown and blocks everything until a lookup", async () => {
    gateway.loseNext();
    await expect(payments.checkout("m1", { ...request, captureLater: true })).rejects.toRefuseWith(
      refusal(PaymentUnknownError, { reference: "ord_1" }),
    );
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.Unknown);
    await expect(payments.capture("ord_1")).rejects.toRefuseWith(refusal(PaymentUnknownError));
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(PaymentUnknownError),
    );
    const record = await payments.reconcile("ord_1");
    expect(record).toMatchObject({ status: PaymentStatus.Pending, providerRef: "fake_ord_1" });
  });

  it("never charges a token twice after a lost answer", async () => {
    const charge = { reference: "inv_1", amount, method, initiator: ChargeInitiator.Customer };
    gateway.loseNext();
    await expect(payments.charge(charge)).rejects.toRefuseWith(refusal(PaymentUnknownError));
    await expect(payments.charge(charge)).rejects.toRefuseWith(refusal(PaymentUnknownError));
    expect((await payments.reconcile("inv_1")).status).toBe(PaymentStatus.Captured);
    expect((await payments.charge(charge)).status).toBe(PaymentStatus.Captured);
  });

  it("refuses a merchant-initiated charge the customer did not agree to", async () => {
    await expect(
      payments.charge({ reference: "inv_2", amount, method, initiator: ChargeInitiator.Merchant }),
    ).rejects.toRefuseWith(refusal(MerchantInitiatedNotAllowedError, { reference: "inv_2" }));
    expect(
      (
        await payments.charge({
          reference: "inv_3",
          amount,
          method: { ...method, merchantInitiated: true },
          initiator: ChargeInitiator.Merchant,
        })
      ).status,
    ).toBe(PaymentStatus.Captured);
  });

  it("captures, refunds in parts and never refunds more than was taken", async () => {
    const session = await payments.checkout("m1", { ...request, captureLater: true });
    gateway.settle(session.providerRef, PaymentStatus.Authorized);
    await payments.reconcile("ord_1");
    expect((await payments.capture("ord_1")).status).toBe(PaymentStatus.Captured);
    await payments.refund("ord_1", Money.ofMinor(4000, "SAR"), "r1");
    expect((await records.find("ord_1"))?.status).toBe(PaymentStatus.PartiallyRefunded);
    await expect(payments.refund("ord_1", Money.ofMinor(7000, "SAR"), "r2")).rejects.toRefuseWith(
      refusal(InvalidPaymentTransitionError, { operation: "refund" }),
    );
    await payments.refund("ord_1", Money.ofMinor(6000, "SAR"), "r3");
    expect(await records.find("ord_1")).toMatchObject({
      status: PaymentStatus.Refunded,
      refunded: { minor: 10_000 },
    });
  });

  it("refuses a capture on a provider that takes payment at once", async () => {
    const hosted = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Checkout] });
    const service = new PaymentService(
      PaymentGatewaysFake.with([hosted]),
      records,
      clock,
      ConnectedAccountLimitsFake.with(),
    );
    const session = await service.checkout("m1", request);
    hosted.settle(session.providerRef, PaymentStatus.Authorized);
    await service.reconcile("ord_1");
    await expect(service.capture("ord_1")).rejects.toRefuseWith(
      refusal(CapabilityUnsupportedError, { provider: "fake", capability: "capture" }),
    );
  });

  it("resolves an unknown payment by hand only with a reason", async () => {
    gateway.loseNext();
    await expect(payments.checkout("m1", request)).rejects.toRefuseWith(
      refusal(PaymentUnknownError),
    );
    await expect(
      payments.resolve("ord_1", PaymentStatus.Captured, { by: "usr_1", reason: "  " }),
    ).rejects.toRefuseWith(refusal(ResolutionReasonRequiredError));
    await expect(
      payments.resolve("ord_1", PaymentStatus.Refunded, { by: "usr_1", reason: "x" }),
    ).rejects.toRefuseWith(refusal(InvalidPaymentTransitionError, { operation: "resolve" }));
    const record = await payments.resolve("ord_1", PaymentStatus.Captured, {
      by: "usr_1",
      reason: "Receipt printed",
    });
    expect(record).toMatchObject({
      status: PaymentStatus.Captured,
      resolution: { by: "usr_1", reason: "Receipt printed" },
    });
    await expect(
      payments.resolve("ord_1", PaymentStatus.Failed, { by: "usr_1", reason: "again" }),
    ).rejects.toRefuseWith(refusal(InvalidPaymentTransitionError));
  });

  it("marks an unknown payment the provider never saw as failed", async () => {
    await records.save({
      reference: "ord_9",
      provider: "fake",
      connectionId: "conn_fake",
      amount,
      refunded: Money.zero("SAR"),
      status: PaymentStatus.Unknown,
      updatedAt: clock.now(),
    });
    expect((await payments.reconcile("ord_9")).status).toBe(PaymentStatus.Failed);
    await expect(payments.reconcile("ord_0")).rejects.toRefuseWith(refusal(NotFoundError));
  });

  it("keeps a terminal tip and reads the final state after a cancel", async () => {
    const tipPrompt = { percentages: [10, 15], custom: true };
    const session = await payments.startTerminal("m1", {
      reference: "chk_1",
      terminalId: "tmr_1",
      amount,
      tipPrompt,
    });
    gateway.settle(session.providerRef, PaymentStatus.Captured, Money.ofMinor(1000, "SAR"));
    expect(await payments.reconcile("chk_1")).toMatchObject({
      status: PaymentStatus.Captured,
      tip: { minor: 1000 },
    });
    await payments.startTerminal("m1", { reference: "chk_2", terminalId: "tmr_1", amount });
    expect((await payments.cancelTerminal("chk_2")).status).toBe(PaymentStatus.Voided);
  });

  it("cancels only the terminal session it names", async () => {
    await payments.startTerminal("m1", { reference: "chk_3", terminalId: "tmr_1", amount });
    await payments.startTerminal("m1", { reference: "chk_4", terminalId: "tmr_1", amount });
    expect((await payments.cancelTerminal("chk_3")).status).toBe(PaymentStatus.Voided);
    expect((await payments.reconcile("chk_4")).status).toBe(PaymentStatus.Pending);
  });

  it("serves a PIN step or a restricted tender only from a provider that has it", async () => {
    const cardOnly = PaymentGatewayFake.with({
      capabilities: [PaymentCapability.Checkout, PaymentCapability.Terminal],
    });
    const plain = new PaymentService(
      PaymentGatewaysFake.with([cardOnly]),
      records,
      clock,
      ConnectedAccountLimitsFake.with(),
    );
    const terminal = { reference: "chk_7", terminalId: "tmr_1", amount };
    await expect(plain.startTerminal("m1", { ...terminal, pinEntry: true })).rejects.toRefuseWith(
      refusal(NoPaymentProviderError),
    );
    await expect(
      plain.startTerminal("m1", { ...terminal, tender: TenderKind.Restricted, program: "snap" }),
    ).rejects.toRefuseWith(refusal(NoPaymentProviderError));
    await expect(
      plain.checkout("m1", { ...request, tender: TenderKind.Restricted, program: "snap" }),
    ).rejects.toRefuseWith(refusal(NoPaymentProviderError));
    const session = await payments.startTerminal("m1", {
      ...terminal,
      pinEntry: true,
      tender: TenderKind.Restricted,
      program: "snap",
    });
    expect(session.status).toBe(PaymentStatus.Pending);
  });

  it("reuses a pay link until it expires", async () => {
    const expiresAt = new Date("2026-10-26T10:00:00Z");
    const link = await payments.payLink("m1", { ...request, expiresAt });
    expect(link).toEqual({ reference: "ord_1", url: "https://pay.example/fake_ord_1", expiresAt });
    expect(await payments.payLink("m1", { ...request, expiresAt })).toEqual(link);
    clock.at = new Date("2026-10-27T10:00:00Z");
    const renewed = await payments.payLink("m1", {
      ...request,
      expiresAt: new Date("2026-10-28T10:00:00Z"),
    });
    expect(renewed.expiresAt).toEqual(new Date("2026-10-28T10:00:00Z"));
  });

  describe("connection modes", () => {
    const cap = Money.ofMinor(5000, "SAR");
    const payout = { reference: "po_1", amount, destination: "acct_1" };

    /** A service over one gateway of `mode` whose cap is `cap` and whose payouts are held. */
    function over(mode: ConnectionMode) {
      const own = PaymentGatewayFake.with({ mode });
      const limits = ConnectedAccountLimitsFake.with({
        caps: { conn_fake: cap },
        held: ["conn_fake"],
      });
      return {
        limits,
        service: new PaymentService(PaymentGatewaysFake.with([own]), records, clock, limits),
      };
    }

    it("caps an unverified connected account and holds its payouts", async () => {
      const { service } = over(ConnectionMode.ConnectedAccount);
      await expect(service.checkout("m1", request)).rejects.toRefuseWith(
        refusal(PreVerificationCapExceededError, { reference: "ord_1" }),
      );
      await expect(
        service.charge({
          reference: "chg_1",
          amount,
          method,
          initiator: ChargeInitiator.Customer,
        }),
      ).rejects.toRefuseWith(refusal(PreVerificationCapExceededError, { reference: "chg_1" }));
      expect(await records.find("ord_1")).toBeNull();
      await expect(
        service.checkout("m1", { ...request, reference: "ord_small", amount: cap }),
      ).resolves.toMatchObject({ kind: "redirect" });
      await expect(service.payout("fake", "conn_fake", payout)).rejects.toRefuseWith(
        refusal(PayoutHeldError, { reference: "po_1" }),
      );
    });

    it("never caps or holds the other modes", async () => {
      for (const mode of [ConnectionMode.OAuthStandard, ConnectionMode.OwnKey]) {
        const { service, limits } = over(mode);
        await expect(
          service.checkout("m1", { ...request, reference: `ord_${mode}` }),
        ).resolves.toBeDefined();
        await expect(service.payout("fake", "conn_fake", payout)).resolves.toMatchObject({
          status: "succeeded",
        });
        expect(limits.asked).toEqual([]);
      }
    });

    it("reads the account's payment methods, or null when the provider does not report them", async () => {
      const wallets = PaymentGatewayFake.with({ methods: ["card", "apple_pay", "klarna"] });
      const service = new PaymentService(
        PaymentGatewaysFake.with([wallets]),
        records,
        clock,
        ConnectedAccountLimitsFake.with(),
      );
      expect(await service.paymentMethods("m1")).toEqual(["card", "apple_pay", "klarna"]);
      const hosted = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Checkout] });
      const plain = new PaymentService(
        PaymentGatewaysFake.with([hosted]),
        records,
        clock,
        ConnectedAccountLimitsFake.with(),
      );
      expect(await plain.paymentMethods("m1")).toBeNull();
    });
  });

  it("opens a SoftPos session only with a provider that has it", async () => {
    const readersOnly = PaymentGatewayFake.with({
      capabilities: [PaymentCapability.Checkout, PaymentCapability.Terminal],
    });
    const plain = new PaymentService(
      PaymentGatewaysFake.with([readersOnly]),
      records,
      clock,
      ConnectedAccountLimitsFake.with(),
    );
    const tap = { reference: "chk_8", terminalId: "tmr_phone", amount, softPos: true };
    await expect(plain.startTerminal("m1", tap)).rejects.toRefuseWith(
      refusal(NoPaymentProviderError),
    );
    expect((await payments.startTerminal("m1", tap)).status).toBe(PaymentStatus.Pending);
  });

  describe("agent payments", () => {
    const confirmation = {
      protocol: "acp",
      agent: "agent_1",
      reference: "cart_1",
      amount,
      confirmedAt: new Date("2026-10-25T09:58:00Z"),
      expiresAt: new Date("2026-10-25T10:15:00Z"),
      method,
    };
    const ask = { protocol: "acp", proof: "proof_1", reference: "cart_1", amount };

    /** The service with the memory protocols driver holding `confirmed`. */
    function withAgents(confirmed = confirmation): PaymentService {
      return new PaymentService(
        PaymentGatewaysFake.with([gateway]),
        records,
        clock,
        ConnectedAccountLimitsFake.with(),
        new MemoryAgentCommerceProtocolsDriver().confirm("proof_1", confirmed),
      );
    }

    it("charges the wallet token within the confirmation, tags the agent, and never twice", async () => {
      const service = withAgents();
      const record = await service.agentCheckout({ ...ask, amount: Money.ofMinor(9000, "SAR") });
      expect(record).toMatchObject({
        reference: "cart_1",
        status: PaymentStatus.Captured,
        agent: { protocol: "acp", agent: "agent_1" },
      });
      expect(await records.find("cart_1")).toMatchObject({ agent: { agent: "agent_1" } });
      expect(await service.agentCheckout(ask)).toEqual(record);
    });

    it("refuses an agent paying alone, for another cart, late or beyond the confirmation", async () => {
      await expect(payments.agentCheckout(ask)).rejects.toRefuseWith(refused("missing"));
      await expect(withAgents().agentCheckout({ ...ask, proof: "forged" })).rejects.toRefuseWith(
        refused("missing"),
      );
      await expect(
        withAgents({ ...confirmation, reference: "cart_2" }).agentCheckout(ask),
      ).rejects.toRefuseWith(refused("reference"));
      await expect(
        withAgents().agentCheckout({ ...ask, amount: Money.ofMinor(10_001, "SAR") }),
      ).rejects.toRefuseWith(refused("amount"));
      await expect(
        withAgents().agentCheckout({ ...ask, amount: Money.ofMinor(100, "USD") }),
      ).rejects.toRefuseWith(refused("amount"));
      clock.at = new Date("2026-10-25T10:15:00Z");
      await expect(withAgents().agentCheckout(ask)).rejects.toRefuseWith(refused("expired"));
      expect(await records.find("cart_1")).toBeNull();
    });
  });

  describe("pre-authorisation", () => {
    const hold = { reference: "tab_1", amount, method, initiator: ChargeInitiator.Customer };

    it("holds, raises, captures part and never holds twice", async () => {
      const held = await payments.preAuthorize(hold);
      expect(held).toMatchObject({ status: PaymentStatus.Authorized, providerRef: "fake_tab_1" });
      expect(await payments.preAuthorize(hold)).toEqual(held);
      const extra = Money.ofMinor(2500, "SAR");
      expect((await payments.increment("tab_1", extra, "tab_1:2")).amount.minor).toBe(12_500);
      expect((await payments.increment("tab_1", extra, "tab_1:2")).amount.minor).toBe(12_500);
      const captured = await payments.capture("tab_1", Money.ofMinor(11_000, "SAR"));
      expect(captured.status).toBe(PaymentStatus.Captured);
      await expect(payments.increment("tab_1", extra, "tab_1:3")).rejects.toRefuseWith(
        refusal(InvalidPaymentTransitionError, {
          reference: "tab_1",
          status: "captured",
          operation: "increment",
        }),
      );
    });

    it("releases a hold nobody spent", async () => {
      await payments.preAuthorize(hold);
      expect((await payments.void("tab_1")).status).toBe(PaymentStatus.Voided);
    });

    it("refuses a non-positive increment and a provider without the capability", async () => {
      await payments.preAuthorize(hold);
      await expect(payments.increment("tab_1", Money.zero("SAR"), "z")).rejects.toRefuseWith(
        refusal(InvalidPaymentTransitionError, { operation: "increment" }),
      );
      const plain = PaymentGatewayFake.with({ capabilities: [PaymentCapability.Tokens] });
      const service = new PaymentService(
        PaymentGatewaysFake.with([plain]),
        new MemoryPaymentRecordsDriver(),
        clock,
        ConnectedAccountLimitsFake.with(),
      );
      await expect(service.preAuthorize(hold)).rejects.toRefuseWith(
        refusal(CapabilityUnsupportedError, { capability: "pre_auth" }),
      );
    });

    it("refuses a merchant-initiated hold the customer did not agree to", async () => {
      await expect(
        payments.preAuthorize({ ...hold, initiator: ChargeInitiator.Merchant }),
      ).rejects.toRefuseWith(refusal(MerchantInitiatedNotAllowedError, { reference: "tab_1" }));
    });
  });
});
