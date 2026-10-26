/**
 * Stackra file contract:
 * Purpose: `ConnectionRecord`, one stored connection as a store keeps it and as the store host returns it: its id, its
 *          owner, its plain fields, its secret fields and the account its `check()` proved.
 * Boundary: a type only. `secrets` holds only what the managed client sends (an API key, a signing secret), keyed by
 *           field; refresh tokens and client secrets never leave the store host (ADR 0308 rule 20). A `Scope`
 *           connection keeps its node's id and path; a `User` connection keeps the user's id.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rules 2, 3, 9, 12 and 14); ADR 0327 (decision 5: `ScopeRef`).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { ConnectionLevel } from "#core/enums/connection-level.enum";
import type { ConnectedAccount } from "#core/values/connected-account.value";

/**
 * A stored connection.
 *
 * @example
 * const record: ConnectionRecord = { id, level: ConnectionLevel.Scope, scope, fields, secrets, account };
 */
export interface ConnectionRecord {
  /** The connection's public id, the `:connectionId` of its webhook URL. */
  readonly id: PublicId<"conn">;

  /** Where it sits. */
  readonly level: ConnectionLevel;

  /** The scope node of a `Scope` connection. */
  readonly scope?: ScopeRef;

  /** The user of a `User` connection. */
  readonly userId?: PublicId<"usr">;

  /** The plain fields. */
  readonly fields: Readonly<Record<string, unknown>>;

  /** The `@Secret` fields' values, by field. */
  readonly secrets: Readonly<Record<string, string>>;

  /** The account `check()` returned. */
  readonly account: ConnectedAccount;

  /** Whose account it acts on; `byo` when absent. */
  readonly source?: ProviderSource;

  /** The managed resource on the platform account it points at; only on a `managed` connection. */
  readonly resourceId?: string;
}
