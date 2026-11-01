/**
 * Stackra file contract:
 * Purpose: `PostgresConnectedAccountLimitsDriver`, the stored-limits `postgres` driver of `ConnectedAccountLimits`:
 *          the cap and payout hold the platform set on each connected account, one row of
 *          `payments.connected_account_limits` (migration `payments.0002`), every change appended to
 *          `payments.connected_account_limit_changes` with who and why.
 * Boundary: implements the port plus `set`, the one write. It fails closed: a connection with no row refuses both
 *           questions with `ConnectedAccountLimitsMissingError`, so an account nobody reviewed is neither paid into nor
 *           paid out of. `set` writes the row and its history in one statement in the caller's transaction; who may
 *           call it (a platform principal) is the calling action's rule, not this driver's. Every statement names the
 *           session's partition as well as the forced policy enforcing it. Raw SQL with every value bound (ADR 0160).
 * Runtime: node
 * Governing contract: R4-6; M3-2; ADR 0263 (ports and drivers); ADR 0239; ADR 0160; `.agents/rules/tenancy.md`;
 *                     STA-1707.
 */
import { Driver } from "@stackra/container";
import type { Database } from "@stackra/database";
import { Money } from "@stackra/money";

import { ConnectedAccountLimits } from "#contracts/ports/connected-account-limits.port";
import type { ConnectedAccountLimitsChange } from "#contracts/types/connected-account-limits-change.type";
import { ConnectedAccountLimitsMissingError } from "#core/errors/connected-account-limits-missing.error";

/** The live limits. */
const LIMITS = '"payments"."connected_account_limits"';

/** Their change history. */
const CHANGES = '"payments"."connected_account_limit_changes"';

/** The session's partition, as the tables' policies read it: its tenant, or null outside one. */
const SCOPE = "nullif(current_setting('app.tenant_id', true), '')";

/** The columns a change writes, after `connection_id` and `scope_id`. */
const SET_COLUMNS = ["cap_minor", "cap_currency", "payout_held", "set_by", "reason", "set_at"];

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** A selected row. */
type LimitsRow = {
  readonly cap_minor: number | string | null;
  readonly cap_currency: string | null;
  readonly payout_held: boolean;
};

/**
 * Keeps platform-set connected-account limits in Postgres, per tenant, with their history.
 *
 * @example
 * await limits.set("conn_1", { cap: Money.of("500", "EUR"), payoutHeld: true, by: "usr_ops", reason: "KYC pending" });
 */
export class PostgresConnectedAccountLimitsDriver extends Driver(ConnectedAccountLimits) {
  /** The connected database; its entity manager is the running transaction's. */
  private readonly database: Database;

  /**
   * @param database - the connected database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /**
   * Implements `ConnectedAccountLimits.cap`, documented there.
   *
   * @throws ConnectedAccountLimitsMissingError when no limits are set for the connection.
   */
  async cap(connectionId: string): Promise<Money | null> {
    const row = await this.row(connectionId);
    return row.cap_minor === null || row.cap_currency === null
      ? null
      : Money.ofMinor(Number(row.cap_minor), row.cap_currency);
  }

  /**
   * Implements `ConnectedAccountLimits.payoutHeld`, documented there.
   *
   * @throws ConnectedAccountLimitsMissingError when no limits are set for the connection.
   */
  async payoutHeld(connectionId: string): Promise<boolean> {
    return (await this.row(connectionId)).payout_held;
  }

  /** Sets the limits of `connectionId` in the session's partition and appends the change to the history. */
  async set(connectionId: string, change: ConnectedAccountLimitsChange): Promise<void> {
    const columns = ["connection_id", "scope_id", ...SET_COLUMNS].join(", ");
    const updates = SET_COLUMNS.map((column) => `${column} = excluded.${column}`).join(", ");
    await this.sql().execute(
      // raw-sql: one live row per connection in the session's partition, and the same values appended as history
      `with changed as (insert into ${LIMITS} (${columns}) values (?, ${SCOPE}, ?, ?, ?, ?, ?, now()) ` +
        `on conflict ((coalesce(scope_id, '-')), connection_id) do update set ${updates} returning ${columns}) ` +
        `insert into ${CHANGES} (${columns}) select ${columns} from changed`,
      [
        connectionId,
        change.cap?.minor ?? null,
        change.cap?.currency ?? null,
        change.payoutHeld,
        change.by,
        change.reason,
      ],
    );
  }

  /** The connection's live limits in the session's partition. */
  private async row(connectionId: string): Promise<LimitsRow> {
    const [row] = (await this.sql().execute(
      // raw-sql: the connection's limits in the session's partition, named as well as enforced by the policy
      `select cap_minor, cap_currency, payout_held from ${LIMITS} ` +
        `where scope_id is not distinct from ${SCOPE} and connection_id = ?`,
      [connectionId],
    )) as readonly LimitsRow[];
    if (row === undefined) throw ConnectedAccountLimitsMissingError.create({ connectionId });
    return row;
  }

  /** The running transaction's entity manager, as raw SQL. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
