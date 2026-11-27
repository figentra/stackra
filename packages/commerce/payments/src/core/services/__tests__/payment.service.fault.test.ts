/**
 * Stackra file contract:
 * Purpose: the fault-injection tests of `PaymentService` (ADR 0182 decision 4), with faults injected into the payment
 *          records (the database) and the provider. A records store that fails before the provider is called charges
 *          nothing, and a retry charges once. A store that fails after the provider charged leaves the reference
 *          pending: a retried charge never reaches the provider again, and `reconcile` records what the provider holds.
 *          A provider that fails before acting with a lost answer makes the payment `unknown`, a retry is refused, and
 *          `reconcile` finds nothing and fails it. A refund whose answer is lost, or whose record cannot be saved, is
 *          retried under the same refund reference (the provider's idempotency key) or reconciled, and never refunds
 *          past the payment. A `reconcile` the store cannot record keeps the payment blocked until one that can.
 * Boundary: test only; the gateway fake and the memory records wrapped by `injectFaults`, a fixed clock. The database
 *           fault of the same path on real Postgres is in `postgres-payment-records.driver.fault.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the fault-injection tests in the unit tier); ADR 0357 (decision 6:
 *                     the `unknown` state and `reconcile`; one payment per merchant reference).
 */
import { Clock } from "@stackra/contracts";
import { refusal } from "@stackra/errors/testing";
import { ProviderUnavailableError } from "@stackra/integrations";
import { Money } from "@stackra/money";
import { describe, expect, InjectedFaultError, injectFaults, it } from "@stackra/testing";
import type { FaultRule } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import { MemoryPaymentRecordsDriver } from "#core/drivers/memory-payment-records.driver";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { PaymentUnknownError } from "#core/errors/payment-unknown.error";
import { PaymentService } from "#core/services/payment.service";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-11-26T12:00:00Z");
  }
}

const amount = Money.ofMinor(10_000, "SAR");

const method = {
  provider: "fake",
  connectionId: "conn_fake",
  token: "tok_1",
  merchantInitiated: false,
};

/** A customer's saved-token charge of 100.00 SAR under `reference`. */
const charge = (reference = "ord_1"): TokenCharge => ({
  reference,
  amount,
  method,
  initiator: ChargeInitiator.Customer,
});

/** A lost answer, as the managed client raises it. */
const lost = () => ProviderUnavailableError.create({ provider: "fake" });

/** The service over the gateway fake and the memory records, each with its faults injected. */
function setup(
  recordFaults: readonly FaultRule<keyof MemoryPaymentRecordsDriver & string>[] = [],
  providerFaults: readonly FaultRule<keyof PaymentGatewayFake & string>[] = [],
) {
  const fake = PaymentGatewayFake.with();
  const provider = injectFaults(fake, providerFaults);
  const real = new MemoryPaymentRecordsDriver();
  const records = injectFaults(real, recordFaults);
  const payments = new PaymentService(
    PaymentGatewaysFake.with([provider.target]),
    records.target,
    new FixedClock(),
    ConnectedAccountLimitsFake.with(),
  );
  return { payments, fake, provider, real, records };
}

describe("PaymentService under injected faults", () => {
  it("charges nothing when the records fail before the provider is called, and once on the retry", async () => {
    const { payments, fake, provider, real } = setup([{ method: "save" }]);
    await expect(payments.charge(charge())).rejects.toBeInstanceOf(InjectedFaultError);
    expect(provider.callsOf("charge")).toEqual([]);
    expect(await real.find("ord_1")).toBeNull();
    expect(await payments.charge(charge())).toMatchObject({ status: PaymentStatus.Captured });
    expect(provider.callsOf("charge")).toHaveLength(1);
    expect(await fake.lookup({ reference: "ord_1" })).toMatchObject({
      status: PaymentStatus.Captured,
    });
  });

  it("never charges twice when the records fail after the provider charged, and reconcile records it", async () => {
    const { payments, provider, real } = setup([{ method: "save", calls: 2 }]);
    await expect(payments.charge(charge())).rejects.toBeInstanceOf(InjectedFaultError);
    expect(provider.callsOf("charge")).toHaveLength(1);
    // the outcome was never recorded: the reference stays pending, with no provider id
    expect(await real.find("ord_1")).toMatchObject({ status: PaymentStatus.Pending });
    expect((await real.find("ord_1"))?.providerRef).toBeUndefined();
    // a retried charge returns the record and never reaches the provider again
    expect(await payments.charge(charge())).toMatchObject({ status: PaymentStatus.Pending });
    expect(provider.callsOf("charge")).toHaveLength(1);
    expect(await payments.reconcile("ord_1")).toMatchObject({
      status: PaymentStatus.Captured,
      providerRef: "fake_ord_1",
    });
    expect(provider.callsOf("charge")).toHaveLength(1);
  });

  it("makes a charge whose provider failed before acting unknown, refuses a retry, and reconcile fails it", async () => {
    const { payments, fake, provider } = setup([], [{ method: "charge", error: lost }]);
    await expect(payments.charge(charge())).rejects.toRefuseWith(
      refusal(PaymentUnknownError, { reference: "ord_1" }),
    );
    await expect(payments.charge(charge())).rejects.toRefuseWith(refusal(PaymentUnknownError));
    expect(provider.callsOf("charge")).toHaveLength(1);
    expect(await fake.lookup({ reference: "ord_1" })).toBeNull();
    expect(await payments.reconcile("ord_1")).toMatchObject({ status: PaymentStatus.Failed });
  });

  it("reconciles a refund whose answer was lost, and refuses to refund it again", async () => {
    const { payments, provider } = setup([], [{ method: "refund", when: "after", error: lost }]);
    await payments.charge(charge());
    await expect(payments.refund("ord_1", amount, "rfd_1")).rejects.toRefuseWith(
      refusal(PaymentUnknownError, { reference: "ord_1" }),
    );
    expect(await payments.reconcile("ord_1")).toMatchObject({ status: PaymentStatus.Refunded });
    await expect(payments.refund("ord_1", amount, "rfd_2")).rejects.toRefuseWith(
      refusal(InvalidPaymentTransitionError, { reference: "ord_1", operation: "refund" }),
    );
    expect(provider.callsOf("refund")).toHaveLength(1);
  });

  it("retries a refund whose record could not be saved under the same refund reference", async () => {
    const { payments, provider, real } = setup([{ method: "save", calls: 3 }]);
    await payments.charge(charge());
    // saves 1 and 2 recorded the charge; save 3 would record the refund
    await expect(payments.refund("ord_1", amount, "rfd_1")).rejects.toBeInstanceOf(
      InjectedFaultError,
    );
    expect(await real.find("ord_1")).toMatchObject({ status: PaymentStatus.Captured });
    await payments.refund("ord_1", amount, "rfd_1");
    expect(
      provider.callsOf("refund").map((call) => (call.args[0] as { reference: string }).reference),
    ).toEqual(["rfd_1", "rfd_1"]);
    expect(await real.find("ord_1")).toMatchObject({
      status: PaymentStatus.Refunded,
      refunded: { minor: 10_000 },
    });
  });

  it("keeps a payment blocked when reconcile cannot record, until one that can", async () => {
    // save 1 opens the record, save 2 marks it unknown, save 3 is the first reconcile's
    const { payments, fake, real } = setup(
      [{ method: "save", calls: 3 }],
      [{ method: "charge", when: "after", error: lost }],
    );
    await expect(payments.charge(charge())).rejects.toRefuseWith(refusal(PaymentUnknownError));
    await expect(payments.reconcile("ord_1")).rejects.toBeInstanceOf(InjectedFaultError);
    expect(await real.find("ord_1")).toMatchObject({ status: PaymentStatus.Unknown });
    await expect(payments.charge(charge())).rejects.toRefuseWith(refusal(PaymentUnknownError));
    expect(await payments.reconcile("ord_1")).toMatchObject({ status: PaymentStatus.Captured });
    expect(await fake.lookup({ reference: "ord_1" })).toMatchObject({
      status: PaymentStatus.Captured,
    });
  });
});
