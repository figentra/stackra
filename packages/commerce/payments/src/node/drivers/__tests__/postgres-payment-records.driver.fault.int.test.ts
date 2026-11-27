/**
 * Stackra file contract:
 * Purpose: the database fault-injection test of a saved-token charge on real Postgres (ADR 0182 decisions 3 and 4):
 *          `PaymentService` over `PostgresPaymentRecordsDriver`, each call in one transaction in the tenant's
 *          partition, as an action's unit of work runs it, with a row trigger (`postgresFault`) failing the write that
 *          records the provider's answer. The transaction rolls back with the pending record, so nothing in the
 *          database says a charge was tried; the retried charge reaches the provider under the same merchant reference
 *          (the provider's idempotency key), the provider holds one payment for it, and the record is written once.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers (`usePostgres`); the compiled 0001 migration
 *           creates the table. The provider is the gateway fake, which keeps one payment per reference as a provider
 *           with idempotent requests does; the fault runs as the container's superuser.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 3 and 4: database faults in the integration tier); ADR 0357 (decision 6:
 *                     one payment per merchant reference); ADR 0239.
 */
import { Clock } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { Money } from "@stackra/money";
import { describe, expect, injectFaults, it, postgresFault } from "@stackra/testing";

import { ChargeInitiator } from "#contracts/enums/charge-initiator.enum";
import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import type { TokenCharge } from "#contracts/types/token-charge.type";
import { PaymentService } from "#core/services/payment.service";
import { CreatePaymentRecordsMigration } from "#node/database/migrations/0001-create-payment-records.migration";
import { PostgresPaymentRecordsDriver } from "#node/drivers/postgres-payment-records.driver";
import { ConnectedAccountLimitsFake } from "#testing/connected-account-limits.fake";
import { PaymentGatewayFake } from "#testing/payment-gateway.fake";
import { PaymentGatewaysFake } from "#testing/payment-gateways.fake";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreatePaymentRecordsMigration, { schema: "payments", createsSchema: true }),
  ],
});

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** A customer's saved-token charge of 100.00 SAR. */
const CHARGE: TokenCharge = {
  reference: "ord_fault_1",
  amount: Money.ofMinor(10_000, "SAR"),
  method: { provider: "fake", connectionId: "conn_fake", token: "tok_1", merchantInitiated: false },
  initiator: ChargeInitiator.Customer,
};

/** Runs `work` in one transaction in the `ten_acme` partition, as an action's unit of work in that scope would. */
function inPartition<T>(work: () => Promise<T>): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    // raw-sql: the tenant setting a scoped session writes, for this transaction only
    await database.em().execute("select set_config('app.tenant_id', 'ten_acme', true)");
    return work();
  });
}

describe("a saved-token charge under a database fault on Postgres", () => {
  it("rolls the pending record back with the failed write, and the retry charges once under the same reference", async () => {
    const fake = PaymentGatewayFake.with();
    const provider = injectFaults(fake, []);
    const payments = new PaymentService(
      PaymentGatewaysFake.with([provider.target]),
      new PostgresPaymentRecordsDriver(postgres.database),
      new SystemClock(),
      ConnectedAccountLimitsFake.with(),
    );
    const superuser = (sql: string) => postgres.database.em().execute(sql);
    // row write 1 is the pending record, row write 2 the provider's answer
    const fault = postgresFault({
      name: "record_answer",
      table: "payments.payment_records",
      on: "insert",
      skip: 1,
    });
    for (const sql of fault.install) await superuser(sql);
    try {
      await expect(inPartition(() => payments.charge(CHARGE))).rejects.toThrow(fault.message);
      expect(await superuser("select reference from payments.payment_records")).toEqual([]);
      expect(await fake.lookup({ reference: CHARGE.reference })).toMatchObject({
        status: PaymentStatus.Captured,
      });
      expect(await inPartition(() => payments.charge(CHARGE))).toMatchObject({
        status: PaymentStatus.Captured,
        providerRef: "fake_ord_fault_1",
      });
    } finally {
      for (const sql of fault.remove) await superuser(sql);
    }
    expect(
      provider.callsOf("charge").map((call) => (call.args[0] as TokenCharge).reference),
    ).toEqual([CHARGE.reference, CHARGE.reference]);
    expect(await superuser("select reference, status from payments.payment_records")).toEqual([
      { reference: "ord_fault_1", status: "captured" },
    ]);
  });
});
