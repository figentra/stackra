/**
 * Stackra file contract:
 * Purpose: `RealtimeSession`, the verified caller behind one live connection: whose it is, the tenant it acts in, its
 *          realm and the permissions it holds, as the server's authenticated endpoint resolved them when it issued
 *          the subscribe token.
 * Boundary: a type only, in the leaf entry. Built by the server from the typed actor, never from what a client sends;
 *           the hub delivers a broadcast only when the session's ids match the channel and it holds the permission.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: IAM authorises each channel); ADR 0098 (decision 6: the actor, realms).
 */
import type { Realm } from "@stackra/contracts";

/** The caller of one connection. */
export interface RealtimeSession {
  /** The principal's public id; `principal.{principalId}.<module>` channels reach only this principal. */
  readonly principalId: string;

  /** The tenant the session acts in; absent for a platform session, which then hears no tenant channel. */
  readonly scopeId?: string;

  /** The user's realm, checked against `RealtimeConfig.channelRealms` for tenant channels. */
  readonly realm?: Realm;

  /** The permission names the session holds (`orders.order.read`). */
  readonly permissions: readonly string[];
}
