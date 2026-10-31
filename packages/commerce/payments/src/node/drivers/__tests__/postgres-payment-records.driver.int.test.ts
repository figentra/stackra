/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresPaymentRecordsDriver` on real Postgres: a full record round-trips (money,
 *          nested parts and their dates), a save replaces in place, optional parts read back absent, an unknown
 *          reference is null, and rows are partitioned by the session's tenant (null outside one).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0001 migration creates the table.
 *           Each case runs in a transaction that sets `app.tenant_id`, as a scoped session would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; STA-1706.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { PaymentStatus } from "#contracts/enums/payment-status.enum";
import { SessionKind } from "#contracts/enums/session-kind.enum";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import { CreatePaymentRecordsMigration } from "#node/database/migrations/0001-create-payment-records.migration";
import { PostgresPaymentRecordsDriver } from "#node/drivers/postgres-payment-records.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreatePaymentRecordsMigration, { schema: "payments", createsSchema: true }),
  ],
});

const AT = new Date("2026-10-31T09:00:00.000Z");

/** A record with every optional part. */
const FULL: PaymentRecord = {
  reference: "ord_1",
  provider: "stripe",
  connectionId: "conn_1",
  providerRef: "pi_1",
  amount: Money.ofMinor(12_345, "EUR"),
  tip: Money.ofMinor(500, "EUR"),
  refunded: Money.ofMinor(0, "EUR"),
  status: PaymentStatus.Unknown,
  terminalId: "tml_1",
  session: {
    providerRef: "cs_1",
    kind: SessionKind.Redirect,
    url: "https://pay.example/cs_1",
    expiresAt: AT,
  },
  method: { provider: "stripe", connectionId: "conn_1", token: "pm_1", merchantInitiated: false },
  resolution: { by: "usr_1", reason: "checked the dashboard", at: AT },
  agent: { protocol: "ap2", agent: "agt_1" },
  updatedAt: AT,
};

/** The same reference with only the required parts. */
const BARE: PaymentRecord = {
  reference: "ord_1",
  provider: "stripe",
  connectionId: "conn_1",
  amount: Money.ofMinor(12_345, "EUR"),
  refunded: Money.ofMinor(12_345, "EUR"),
  status: PaymentStatus.Refunded,
  updatedAt: AT,
};

/** Runs `work` with a store in a transaction whose `app.tenant_id` is `partition` (none when undefined). */
function inPartition<T>(
  partition: string | undefined,
  work: (store: PostgresPaymentRecordsDriver) => Promise<T>,
): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em() as unknown as {
      execute: (sql: string, params: readonly unknown[]) => Promise<unknown>;
    };
    if (partition !== undefined)
      await em.execute("select set_config('app.tenant_id', ?, true)", [partition]);
    return work(new PostgresPaymentRecordsDriver(database));
  });
}

describe(PostgresPaymentRecordsDriver, () => {
  it("round-trips a full record and replaces it in place", async () => {
    await inPartition("ten_acme", async (store) => {
      await expect(store.find("ord_1")).resolves.toBeNull();
      await store.save(FULL);
      expect(await store.find("ord_1")).toEqual(FULL);
      await store.save(BARE);
      expect(await store.find("ord_1")).toEqual(BARE);
    });
  });

  it("keeps each tenant's records, and a partition for a session in no tenant", async () => {
    await inPartition("ten_other", (store) => store.save(FULL));
    await inPartition(undefined, (store) => store.save(BARE));
    expect(await inPartition("ten_other", (store) => store.find("ord_1"))).toEqual(FULL);
    expect(await inPartition(undefined, (store) => store.find("ord_1"))).toEqual(BARE);
    await expect(inPartition("ten_none", (store) => store.find("ord_1"))).resolves.toBeNull();
  });
});
