/**
 * Stackra file contract:
 * Purpose: `PostgresApprovalBindingStoreDriver`, the Postgres `ApprovalBindingStore` of a service that owns declared
 *          actions: insert, read by approval id, and the prune's delete, over `tenancy.approval_bindings`.
 * Boundary: implements the port only. Insert-only: it has no update. Every statement runs on the running transaction of
 *           the caller's `CallIsolation` run (`database.em()`), so the table's forced tenant policy limits a read and a
 *           delete to the tenant of that run, and an insert whose `tenant_id` differs from it fails the policy's WITH
 *           CHECK. The insert names the tenant from the binding itself, so a mismatch with the running tenant fails
 *           closed instead of being relabelled; the id is the approval id, so a second insert of it fails the key. The
 *           statements are raw SQL, each marked, because the table is read by the pipeline before gen writes entity
 *           files for it (STA-339).
 * Runtime: node
 * Governing contract: ADR 0509 (the binding, B1, N7); ADR 0239 (equality on `tenant_id`); ADR 0495 (isolation runs);
 *                     ADR 0294 (decisions 15 and 16).
 */
import { ApprovalBindingStore } from "@stackra/actions/contracts";
import type { ApprovalBinding } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Actor, AssuranceLevel, PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";

/** The table. */
const BINDINGS = '"tenancy"."approval_bindings"';

/** The raw-SQL surface of the entity manager this driver uses. */
interface Sql {
  execute: (statement: string, params: readonly unknown[]) => Promise<unknown>;
}

/** One stored row, as the driver selects it. */
interface Row {
  readonly id: PublicId<"apr">;
  readonly tenant_id: PublicId;
  readonly scope: ScopeRef | string | null;
  readonly requester: Actor | string;
  readonly key: string;
  readonly input_hash: string;
  readonly assurance_amr: string[] | string | null;
  readonly assurance_level: AssuranceLevel | null;
  readonly assurance_auth_time: Date | string | null;
  readonly requested_at: Date | string;
  readonly expires_at: Date | string;
  readonly approvals: number;
  readonly permission: string | null;
  readonly approver_level: AssuranceLevel | null;
  readonly confirm: boolean;
  readonly execute: string;
}

/** A jsonb value, which a driver may return parsed or as text. */
function parsed<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

/** The binding of a stored row. */
function bindingOf(row: Row): ApprovalBinding {
  const amr = row.assurance_amr === null ? null : parsed(row.assurance_amr);
  return {
    approvalId: row.id,
    scopeId: row.tenant_id,
    ...(row.scope === null ? {} : { scope: parsed(row.scope) }),
    requester: parsed(row.requester),
    key: row.key,
    inputHash: row.input_hash,
    ...(amr === null
      ? {}
      : {
          assurance: {
            amr,
            level: row.assurance_level ?? undefined,
            authTime:
              row.assurance_auth_time === null ? undefined : new Date(row.assurance_auth_time),
          },
        }),
    requestedAt: new Date(row.requested_at),
    expiresAt: new Date(row.expires_at),
    approvals: Number(row.approvals),
    ...(row.permission === null ? {} : { permission: row.permission }),
    ...(row.approver_level === null ? {} : { approverLevel: row.approver_level }),
    confirm: row.confirm,
    execute: row.execute as ApprovalBinding["execute"],
  };
}

/**
 * Stores bindings in Postgres.
 *
 * @example
 * container.bind(ApprovalBindingStore, PostgresApprovalBindingStoreDriver);
 */
export class PostgresApprovalBindingStoreDriver extends Driver(ApprovalBindingStore) {
  /** The connected database; its running transaction is the caller's isolation run. */
  private readonly database: Database;

  /**
   * @param database - the service's database.
   */
  constructor(database: Database) {
    super();
    this.database = database;
  }

  /** Inserts the binding; a second insert of the id, or a tenant other than the running one, rejects. */
  async insert(binding: ApprovalBinding): Promise<void> {
    await this.sql().execute(
      // raw-sql: the one insert of a binding; the forced tenant policy checks tenant_id against the running tenant
      `insert into ${BINDINGS} (id, tenant_id, scope, requester, "key", input_hash, assurance_amr, assurance_level, ` +
        "assurance_auth_time, requested_at, expires_at, approvals, permission, approver_level, confirm, execute) " +
        "values (?, ?, ?::jsonb, ?::jsonb, ?, ?, ?::jsonb, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        binding.approvalId,
        binding.scopeId,
        binding.scope === undefined ? null : JSON.stringify(binding.scope),
        JSON.stringify(binding.requester),
        binding.key,
        binding.inputHash,
        binding.assurance === undefined ? null : JSON.stringify(binding.assurance.amr),
        binding.assurance?.level ?? null,
        binding.assurance?.authTime ?? null,
        binding.requestedAt,
        binding.expiresAt,
        binding.approvals,
        binding.permission ?? null,
        binding.approverLevel ?? null,
        binding.confirm,
        binding.execute,
      ],
    );
  }

  /** The binding of the running tenant with `approvalId`, or `undefined`. */
  async find(approvalId: string): Promise<ApprovalBinding | undefined> {
    const rows = (await this.sql().execute(
      // raw-sql: the one row with this id; the tenant policy hides another tenant's
      `select id, tenant_id, scope, requester, "key", input_hash, assurance_amr, assurance_level, assurance_auth_time, ` +
        `requested_at, expires_at, approvals, permission, approver_level, confirm, execute from ${BINDINGS} where id = ?`,
      [approvalId],
    )) as readonly Row[];
    const [row] = rows;
    return row === undefined ? undefined : bindingOf(row);
  }

  /** Deletes the running tenant's bindings that expired before `cutoff`; resolves to how many. */
  async prune(cutoff: Date): Promise<number> {
    const rows = (await this.sql().execute(
      // raw-sql: the retention delete, the one change a binding takes after its insert; the tenant policy limits it
      `delete from ${BINDINGS} where expires_at < ? returning id`,
      [cutoff],
    )) as readonly unknown[];
    return rows.length;
  }

  /** The running transaction's raw-SQL surface. */
  private sql(): Sql {
    return this.database.em() as unknown as Sql;
  }
}
