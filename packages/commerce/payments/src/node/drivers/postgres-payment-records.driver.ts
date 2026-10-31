/**
 * Stackra file contract:
 * Purpose: `PostgresPaymentRecordsDriver`, the `postgres` driver of `PaymentRecords`: each record is one row of
 *          `payments.payment_records` (migration `payments.0001`).
 * Boundary: implements the port only. It runs in the caller's transaction, so a record and the event the action
 *           records commit together, and the table's forced policy sees the session's tenant (null outside one). Every
 *           statement names the partition as well, so a role that bypasses row-level security still reads and writes
 *           only its own tenant's rows. `save` is an upsert on the one-per-reference index. Raw SQL with every value
 *           bound (ADR 0160); the nested parts are JSON with their dates revived on read.
 * Runtime: node
 * Governing contract: ADR 0263 (ports and drivers); ADR 0357 (decision 6); ADR 0239; ADR 0160;
 *                     `.agents/rules/tenancy.md`; STA-1706.
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Money } from "@stackra/money";

import { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { PaymentRecord } from "#contracts/types/payment-record.type";

/** The table. */
const RECORDS = '"payments"."payment_records"';

/** The session's partition, as the table's policy reads it: its tenant, or null outside one. */
const SCOPE = "nullif(current_setting('app.tenant_id', true), '')";

/** The columns written and read back, in order. */
const COLUMNS = [
  "reference",
  "provider",
  "connection_id",
  "provider_ref",
  "status",
  "amount_minor",
  "amount_currency",
  "tip_minor",
  "tip_currency",
  "refunded_minor",
  "refunded_currency",
  "terminal_id",
  "session",
  "method",
  "resolution",
  "agent",
  "updated_at",
] as const;

/** The JSON columns. */
const JSON_COLUMNS = new Set<string>(["session", "method", "resolution", "agent"]);

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A selected row. */
type RecordRow = { readonly [column in (typeof COLUMNS)[number]]: unknown };

/** A JSON column's value, parsed when the client hands back text. */
const jsonOf = (value: unknown): Record<string, unknown> | undefined =>
  value === null || value === undefined
    ? undefined
    : ((typeof value === "string" ? JSON.parse(value) : value) as Record<string, unknown>);

/** A bigint column's value as a number of minor units. */
const minorOf = (value: unknown): number => Number(value);

/** A row as the port's record; optional parts absent when null. */
function recordOf(row: RecordRow): PaymentRecord {
  const session = jsonOf(row.session);
  const method = jsonOf(row.method);
  const resolution = jsonOf(row.resolution);
  const agent = jsonOf(row.agent);
  return {
    reference: String(row.reference),
    provider: String(row.provider),
    connectionId: String(row.connection_id),
    ...(row.provider_ref === null ? {} : { providerRef: String(row.provider_ref) }),
    amount: Money.ofMinor(minorOf(row.amount_minor), String(row.amount_currency)),
    ...(row.tip_minor === null
      ? {}
      : { tip: Money.ofMinor(minorOf(row.tip_minor), String(row.tip_currency)) }),
    refunded: Money.ofMinor(minorOf(row.refunded_minor), String(row.refunded_currency)),
    status: row.status as PaymentRecord["status"],
    ...(row.terminal_id === null ? {} : { terminalId: String(row.terminal_id) }),
    ...(session === undefined
      ? {}
      : {
          session: {
            ...session,
            ...(session["expiresAt"] === undefined
              ? {}
              : { expiresAt: new Date(String(session["expiresAt"])) }),
          } as unknown as NonNullable<PaymentRecord["session"]>,
        }),
    ...(method === undefined
      ? {}
      : { method: method as unknown as NonNullable<PaymentRecord["method"]> }),
    ...(resolution === undefined
      ? {}
      : {
          resolution: {
            ...resolution,
            at: new Date(String(resolution["at"])),
          } as unknown as NonNullable<PaymentRecord["resolution"]>,
        }),
    ...(agent === undefined
      ? {}
      : { agent: agent as unknown as NonNullable<PaymentRecord["agent"]> }),
    updatedAt: new Date(row.updated_at as Date | string),
  };
}

/** The record's column values, in `COLUMNS` order. */
function valuesOf(record: PaymentRecord): unknown[] {
  return [
    record.reference,
    record.provider,
    record.connectionId,
    record.providerRef ?? null,
    record.status,
    record.amount.minor,
    record.amount.currency,
    record.tip?.minor ?? null,
    record.tip?.currency ?? null,
    record.refunded.minor,
    record.refunded.currency,
    record.terminalId ?? null,
    record.session === undefined ? null : JSON.stringify(record.session),
    record.method === undefined ? null : JSON.stringify(record.method),
    record.resolution === undefined ? null : JSON.stringify(record.resolution),
    record.agent === undefined ? null : JSON.stringify(record.agent),
    record.updatedAt,
  ];
}

/**
 * Keeps payment records in Postgres, per tenant.
 *
 * @example
 * // generated wiring: { port: PaymentRecords, candidates: { postgres: … }, deps: { postgres: [Database] } }
 */
export class PostgresPaymentRecordsDriver extends Driver(PaymentRecords) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Implements `PaymentRecords.find`, documented there. */
  async find(reference: string): Promise<PaymentRecord | null> {
    const [row] = (await this.sql().execute(
      // raw-sql: the reference's record in the session's partition, named as well as enforced by the policy
      `select ${COLUMNS.join(", ")} from ${RECORDS} where scope_id is not distinct from ${SCOPE} and reference = ?`,
      [reference],
    )) as readonly RecordRow[];
    return row === undefined ? null : recordOf(row);
  }

  /** Implements `PaymentRecords.save`, documented there. */
  async save(record: PaymentRecord): Promise<void> {
    const placeholders = COLUMNS.map((column) => (JSON_COLUMNS.has(column) ? "?::jsonb" : "?"));
    const updates = COLUMNS.filter((column) => column !== "reference").map(
      (column) => `${column} = excluded.${column}`,
    );
    await this.sql().execute(
      // raw-sql: one record per reference in the session's partition, replaced in place
      `insert into ${RECORDS} (scope_id, ${COLUMNS.join(", ")}) values (${SCOPE}, ${placeholders.join(", ")}) ` +
        `on conflict ((coalesce(scope_id, '-')), reference) do update set ${updates.join(", ")}`,
      valuesOf(record),
    );
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
